"""Generate deployable Dutch MP3 assets using offline Piper, not a runtime API.

Setup (from the repository root, Python 3.13/Windows or supported Python):
  python -m pip install --target .cache/dutch-audio/python piper-tts==1.8.0 lameenc==1.9.0
  Download nl_NL-mls-medium.onnx and its .onnx.json from the URL in ATTRIBUTION.md
  into .cache/dutch-audio, then run:
  python scripts/generate-dutch-audio.py --workers 6

Use --sample for the first 20 preview clips; --priority 1 also includes headwords.
The expected manifest is written up front; finish full generation before release.
Re-running resumes existing audio.
All transient files and dependencies remain under ignored .cache/dutch-audio.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'dutch-audio'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(CACHE / 'verify-python'))


def verify_audio(jobs: list[dict], directory: Path) -> None:
    """Decode every published MP3 and reject missing, silent or broken files."""
    import miniaudio
    import numpy as np
    failures = []
    seconds = 0.0
    total_bytes = 0
    minimum_duration = float('inf')
    minimum_peak = 32768
    for index, job in enumerate(jobs, 1):
        path = directory / job['filename']
        try:
            if not path.exists() or path.stat().st_size < 200:
                raise ValueError('missing/empty MP3')
            decoded = miniaudio.decode_file(str(path), output_format=miniaudio.SampleFormat.SIGNED16, nchannels=1, sample_rate=22050)
            samples = np.asarray(decoded.samples, dtype=np.int32)
            duration = samples.size / 22050
            peak = int(np.max(np.abs(samples))) if samples.size else 0
            rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2))) if samples.size else 0
            if duration < .15 or peak < 100 or rms < 5:
                raise ValueError(f'silent/short decoded audio: seconds={duration:.3f}, peak={peak}, rms={rms:.2f}')
            minimum_duration = min(minimum_duration, duration)
            minimum_peak = min(minimum_peak, peak)
            seconds += duration
            total_bytes += path.stat().st_size
        except Exception as error:
            failures.append({'key': job['key'], 'error': str(error)})
        if index % 500 == 0 or index == len(jobs):
            print(json.dumps({'verified': index, 'requested': len(jobs), 'failures': len(failures)}), flush=True)
    report = {'files': len(jobs), 'decoded_seconds': round(seconds, 2), 'total_bytes': total_bytes,
              'minimum_duration_seconds': minimum_duration if minimum_duration < float('inf') else 0,
              'minimum_peak': minimum_peak, 'failures': failures}
    (CACHE / 'verification-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True), flush=True)
    if failures:
        raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workers', type=int, default=6)
    parser.add_argument('--sample', action='store_true')
    parser.add_argument('--priority', type=int, default=6)
    parser.add_argument('--skip-collect', action='store_true')
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--verify', action='store_true')
    args = parser.parse_args()
    if not args.skip_collect:
        subprocess.run(['node', str(ROOT / 'scripts/generate-dutch-audio.mjs')], cwd=ROOT, check=True)
    if args.verify_only:
        verify_audio(json.loads((CACHE / 'jobs.json').read_text(encoding='utf-8')), ROOT / 'public' / 'audio' / 'nl')
        return
    import lameenc
    import numpy as np
    import onnxruntime as ort
    from piper import PiperVoice, SynthesisConfig
    from piper.config import PiperConfig

    all_jobs = json.loads((CACHE / 'jobs.json').read_text(encoding='utf-8'))
    jobs = [job for job in all_jobs if job['priority'] <= args.priority]
    if args.sample:
        jobs = jobs[:20]
    directory = ROOT / 'public' / 'audio' / 'nl'
    directory.mkdir(parents=True, exist_ok=True)
    temporary = CACHE / 'tmp'
    temporary.mkdir(parents=True, exist_ok=True)
    manifest_file = ROOT / 'app' / 'data' / 'dutch-audio.json'
    model_path = CACHE / 'nl_NL-mls-medium.onnx'
    config = PiperConfig.from_dict(json.loads(model_path.with_suffix('.onnx.json').read_text(encoding='utf-8')))
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model_path), sess_options=options, providers=['CPUExecutionProvider'])
    voice = PiperVoice(session=session, config=config)
    synthesis = SynthesisConfig(speaker_id=6, length_scale=1.05, noise_scale=0.333, noise_w_scale=0.333, normalize_audio=True)
    started = time.monotonic()
    manifest = {}
    for job in all_jobs:
        path = directory / job['filename']
        if path.exists() and path.stat().st_size > 200:
            manifest[job['key']] = '/audio/nl/' + job['filename']

    def save_manifest() -> None:
        expected = {job['key']: '/audio/nl/' + job['filename'] for job in all_jobs}
        text = json.dumps(dict(sorted(expected.items())), ensure_ascii=False, indent=2) + '\n'
        if manifest_file.exists() and manifest_file.read_text(encoding='utf-8') == text:
            return
        temporary_manifest = CACHE / 'manifest.json.tmp'
        temporary_manifest.write_text(text, encoding='utf-8')
        os.replace(temporary_manifest, manifest_file)

    def generate(job: dict) -> dict:
        if job['key'] in manifest:
            return {'job': job, 'cached': True, 'seconds': 0}
        began = time.monotonic()
        chunks = list(voice.synthesize(job['text'], syn_config=synthesis))
        if not chunks:
            raise RuntimeError('Piper returned no chunks for ' + job['key'])
        pcm_parts = []
        sample_rate = chunks[0].sample_rate
        for index, chunk in enumerate(chunks):
            if chunk.sample_channels != 1 or chunk.sample_rate != sample_rate:
                raise RuntimeError('Unexpected audio format')
            if index:
                pcm_parts.append(bytes(int(sample_rate * .18) * 2))
            pcm_parts.append(chunk.audio_int16_bytes)
        pcm = b''.join(pcm_parts)
        samples = np.frombuffer(pcm, dtype='<i2')
        # Very short standalone vowels (e.g. u) can legitimately be <150 ms.
        # Preserve the speech and add a tiny tail, rather than omitting the word.
        if samples.size >= sample_rate * .06 and samples.size < sample_rate * .2:
            pcm += bytes(int(sample_rate * .15) * 2)
            samples = np.frombuffer(pcm, dtype='<i2')
        if samples.size < sample_rate * .15 or np.max(np.abs(samples.astype(np.int32))) < 100:
            raise RuntimeError('Silent/short audio for ' + job['key'])
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(64)
        encoder.set_in_sample_rate(sample_rate)
        encoder.set_channels(1)
        encoder.set_quality(2)
        encoded = bytes(encoder.encode(pcm)) + bytes(encoder.flush())
        temp_path = temporary / job['filename']
        temp_path.write_bytes(encoded)
        os.replace(temp_path, directory / job['filename'])
        return {'job': job, 'cached': False, 'seconds': time.monotonic() - began, 'duration': samples.size / sample_rate, 'bytes': len(encoded)}

    save_manifest()
    failures = []
    completed = 0
    generated = 0
    generated_seconds = 0
    sample_durations = []
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 8))) as pool:
        pending = {pool.submit(generate, job): job for job in jobs}
        for future in as_completed(pending):
            job = pending[future]
            try:
                result = future.result()
                manifest[job['key']] = '/audio/nl/' + job['filename']
                if not result['cached']:
                    generated += 1
                    generated_seconds += result['seconds']
                    sample_durations.append(result.get('duration', 0))
            except Exception as error:
                failures.append({'key': job['key'], 'error': str(error)})
                print(json.dumps({'failure': failures[-1]}, ensure_ascii=True), flush=True)
            completed += 1
            if completed % 40 == 0 or completed == len(jobs):
                save_manifest()
                print(json.dumps({'completed': completed, 'requested': len(jobs), 'manifest': len(manifest), 'generated': generated, 'elapsed': round(time.monotonic() - started, 1), 'failures': len(failures)}), flush=True)
    save_manifest()
    (CACHE / 'failures.json').write_text(json.dumps(failures, ensure_ascii=False, indent=2), encoding='utf-8')
    total_bytes = sum(path.stat().st_size for path in directory.glob('*.mp3'))
    metadata = {'voice': 'Piper nl_NL-mls-medium', 'speaker': 'MLS 7432 (speaker_id=6)', 'sample_rate': config.sample_rate,
                'bitrate_kbps': 64, 'files': len(manifest), 'total_bytes': total_bytes, 'generated': generated,
                'elapsed_seconds': round(time.monotonic() - started, 2), 'synthesis_worker_seconds': round(generated_seconds, 2),
                'audio_seconds_generated': round(sum(sample_durations), 2), 'failures': len(failures),
                'model_sha256': hashlib.sha256(model_path.read_bytes()).hexdigest()}
    (CACHE / 'generation-report.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    print(json.dumps(metadata), flush=True)
    if failures:
        raise SystemExit(1)
    if args.verify:
        verify_audio(all_jobs, directory)


if __name__ == '__main__':
    main()
