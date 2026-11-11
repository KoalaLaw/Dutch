"""Generate static Netherlands Dutch MP3 files with Microsoft Edge Fenna.

Build-time network access is required; playback has no external TTS API dependency.
Install cached build-only dependencies:
  python -m pip install --target .cache/dutch-audio/edge-python edge-tts==7.3.1
  python -m pip install --target .cache/dutch-audio/verify-python miniaudio==1.73
Run: python scripts/generate-dutch-audio-edge.py --workers 3 --verify
Resume: add --skip-collect. Verification: --verify-only --skip-collect.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
import random
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'dutch-audio'
sys.path[:0] = [str(CACHE / 'edge-python'), str(CACHE / 'verify-python')]
VOICE = 'nl-NL-FennaNeural'
LOCALE = 'nl-NL'
VOICE_VERSION = 'edge-tts|nl-NL-FennaNeural|rate+0%|mp3-v1'


def inspect_audio(path: Path) -> dict:
    import miniaudio
    if not path.exists() or path.stat().st_size < 200:
        raise ValueError('Missing or empty MP3')
    info = miniaudio.get_file_info(str(path))
    if info.sample_rate != 24000 or info.nchannels != 1:
        raise ValueError(f'Unexpected MP3 format: {info.sample_rate} Hz / {info.nchannels} channels')
    decoded = miniaudio.decode_file(str(path), output_format=miniaudio.SampleFormat.SIGNED16, nchannels=1, sample_rate=24000)
    peak = max((abs(sample) for sample in decoded.samples), default=0)
    duration = len(decoded.samples) / 24000
    if duration < .08 or peak < 50:
        raise ValueError(f'Silent/short MP3: {duration:.3f}s, peak={peak}')
    return {'seconds': duration, 'peak': peak, 'bytes': path.stat().st_size}


def verify_all(jobs: list[dict]) -> None:
    directory = ROOT / 'public' / 'audio' / 'nl'
    failures = []
    seconds = 0.0
    total_bytes = 0
    minimum_duration = float('inf')
    minimum_peak = 32768
    for index, job in enumerate(jobs, 1):
        try:
            info = inspect_audio(directory / job['filename'])
            seconds += info['seconds']
            total_bytes += info['bytes']
            minimum_duration = min(minimum_duration, info['seconds'])
            minimum_peak = min(minimum_peak, info['peak'])
        except Exception as error:
            failures.append({'key': job['key'], 'error': str(error)})
        if index % 500 == 0 or index == len(jobs):
            print(json.dumps({'verified': index, 'expected': len(jobs), 'failures': len(failures)}), flush=True)
    report = {'provider': 'Microsoft Edge', 'voice': VOICE, 'locale': LOCALE,
              'format': 'MP3 24000 Hz mono, service output 48 kbit/s',
              'files': len(jobs), 'decoded_seconds': round(seconds, 2), 'total_bytes': total_bytes,
              'minimum_duration_seconds': minimum_duration if minimum_duration < float('inf') else 0,
              'minimum_peak': minimum_peak, 'failures': failures,
              'scope': 'File completeness, decode, format, duration and nonzero waveform only; not a phonetic accuracy evaluation.'}
    (CACHE / 'edge-verification-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True), flush=True)
    if failures:
        raise SystemExit(1)


async def generate(jobs: list[dict], args: argparse.Namespace) -> None:
    import edge_tts
    directory = ROOT / 'public' / 'audio' / 'nl'
    directory.mkdir(parents=True, exist_ok=True)
    temporary = CACHE / 'edge-tmp'
    temporary.mkdir(parents=True, exist_ok=True)
    selected = [job for job in jobs if job['priority'] <= args.priority]
    if args.limit:
        selected = selected[:args.limit]
    cached = [job for job in selected if (directory / job['filename']).exists() and (directory / job['filename']).stat().st_size > 200]
    cached_keys = {job['key'] for job in cached}
    queue = asyncio.Queue()
    for job in selected:
        if job['key'] not in cached_keys:
            queue.put_nowait(job)
    completed = len(cached)
    created = 0
    failures = []
    started = time.monotonic()
    next_request = 0.0
    cooldown_until = 0.0
    consecutive_errors = 0
    stopped = asyncio.Event()
    request_gate = asyncio.Lock()

    async def throttle() -> None:
        nonlocal next_request
        async with request_gate:
            wait = max(0, next_request - time.monotonic(), cooldown_until - time.monotonic())
            if wait:
                await asyncio.sleep(wait)
            next_request = time.monotonic() + args.interval

    async def worker() -> None:
        nonlocal completed, created, cooldown_until, consecutive_errors
        while not queue.empty() and not stopped.is_set():
            try:
                job = queue.get_nowait()
            except asyncio.QueueEmpty:
                return
            error_message = ''
            for attempt in range(args.retries + 1):
                if stopped.is_set():
                    break
                await throttle()
                path = temporary / job['filename']
                try:
                    # Communicate owns/closes its session connector, so each request
                    # uses its own connection. The worker pool bounds concurrency.
                    communicate = edge_tts.Communicate(job['text'], voice=VOICE, rate='+0%', volume='+0%', pitch='+0Hz',
                        connect_timeout=15, receive_timeout=75)
                    data = bytearray()
                    async for chunk in communicate.stream():
                        if chunk['type'] == 'audio':
                            data.extend(chunk['data'])
                    if len(data) < 200:
                        raise ValueError('Service returned no usable audio')
                    path.write_bytes(data)
                    await asyncio.to_thread(inspect_audio, path)
                    os.replace(path, directory / job['filename'])
                    created += 1
                    consecutive_errors = 0
                    error_message = ''
                    break
                except Exception as error:
                    error_message = f'{type(error).__name__}: {error}'
                    consecutive_errors += 1
                    status = getattr(error, 'status', None)
                    delay = min(40.0, .8 * 2 ** attempt) + random.uniform(.1, .4)
                    if status in (403, 429):
                        delay = max(delay, 60.0 if status == 429 else 30.0)
                        cooldown_until = max(cooldown_until, time.monotonic() + delay)
                    print(json.dumps({'retry': job['key'], 'attempt': attempt + 1, 'status': status,
                                      'wait_seconds': round(delay, 1), 'error': error_message}, ensure_ascii=True), flush=True)
                    if consecutive_errors >= 12:
                        stopped.set()
                        print(json.dumps({'stopped': 'Repeated service errors; safe to resume later. No identity or rate-limit bypass attempted.'}), flush=True)
                        break
                    if attempt < args.retries:
                        await asyncio.sleep(delay)
            if error_message:
                failures.append({'key': job['key'], 'error': error_message})
            completed += 1
            if completed <= len(cached) + 20 or completed % 40 == 0 or completed == len(selected):
                elapsed = time.monotonic() - started
                print(json.dumps({'completed': completed, 'requested': len(selected), 'created': created,
                                  'cached': len(cached), 'elapsed_seconds': round(elapsed, 1), 'failures': len(failures)}), flush=True)
            queue.task_done()
    await asyncio.gather(*(worker() for _ in range(args.workers)))
    complete = [job for job in jobs if (directory / job['filename']).exists() and (directory / job['filename']).stat().st_size > 200]
    report = {'provider': 'Microsoft Edge', 'voice': VOICE, 'locale': LOCALE, 'engine_tag': VOICE_VERSION,
              'expected': len(jobs), 'files': len(complete), 'created': created, 'cached': len(cached),
              'elapsed_seconds': round(time.monotonic() - started, 2), 'failures': failures,
              'pending_selected': max(0, len(selected) - completed),
              'total_bytes': sum((directory / job['filename']).stat().st_size for job in complete)}
    (CACHE / 'edge-generation-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True), flush=True)
    if failures or report['pending_selected']:
        raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workers', type=int, choices=range(1, 7), default=3)
    parser.add_argument('--interval', type=float, default=.2, help='Global minimum delay between request starts.')
    parser.add_argument('--retries', type=int, default=5)
    parser.add_argument('--priority', type=int, default=6)
    parser.add_argument('--limit', type=int)
    parser.add_argument('--skip-collect', action='store_true')
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    if args.interval < .2 or (args.workers > 4 and args.interval < .25):
        parser.error('Use >=0.2s global interval, or >=0.25s with 5–6 workers (at most 4 starts/second).')
    if not args.skip_collect:
        subprocess.run(['node', str(ROOT / 'scripts/generate-dutch-audio.mjs')], cwd=ROOT, check=True)
    source = json.loads((ROOT / 'app' / 'data' / 'dutch-audio-source.json').read_text(encoding='utf-8'))
    if source.get('voice') != VOICE or source.get('locale') != LOCALE:
        raise SystemExit('Audio source metadata does not match the configured voice/locale. Update both before generation.')
    jobs = json.loads((CACHE / 'jobs.json').read_text(encoding='utf-8'))
    for job in jobs:
        expected = hashlib.sha256((VOICE_VERSION + '|' + job['key']).encode('utf-8')).hexdigest()[:24] + '.mp3'
        if job['filename'] != expected:
            raise SystemExit('Jobs use a different voice/engine hash. Run the current generate-dutch-audio.mjs first.')
    if args.verify_only:
        verify_all(jobs)
        return
    asyncio.run(generate(jobs, args))
    if args.verify:
        verify_all(jobs)


if __name__ == '__main__':
    main()
