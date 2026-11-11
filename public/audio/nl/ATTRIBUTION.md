# Dutch pronunciation assets — Microsoft Edge Fenna

The current pronunciation set uses **Microsoft Edge `nl-NL-FennaNeural`**, whose
locale is **nl-NL (Dutch, Netherlands)**. Voice identity is also recorded in
`app/data/dutch-audio-source.json` so the site can display the actual source.

These are synthesized readings of Type Dutch's original learning texts, created
at build time using [edge-tts 7.3.1](https://github.com/rany2/edge-tts). The library
is licensed under LGPL-3.0; the Microsoft voice/service is a separate source and
is not represented here as an open-source voice model. The source service
identifies the voice as Fenna. Microsoft has not reviewed or endorsed this site.

The service returns **24,000 Hz, 48 kbit/s, mono MP3**. Rate is `+0%`, volume is
`+0%`, and pitch is `+0Hz`. Playback uses static files hosted with the site and
does not call a TTS API or require a Dutch operating-system voice.

The previous Piper clips were replaced after user feedback about pronunciation.
File validation confirms completeness, decoding and nonzero sound. It does not
establish phonetic correctness of every word; targeted listening feedback is
still useful for individual terms, names, abbreviations and ambiguous words.

## Regeneration

From the repository root, install build-only dependencies into ignored caches:

    python -m pip install --target .cache/dutch-audio/edge-python edge-tts==7.3.1
    python -m pip install --target .cache/dutch-audio/verify-python miniaudio==1.73

Generate with the conservative default of three parallel requests and a global
0.2 second minimum request-start interval. Network access is needed at generation time:

    python scripts/generate-dutch-audio-edge.py --workers 3 --verify

For this corpus a bounded six-worker run may be used with `--interval 0.25`,
which still allows at most four request starts per second. Lower concurrency
if the service returns rate limits; do not bypass service restrictions.

Resume existing completed files, or verify without regeneration:

    python scripts/generate-dutch-audio-edge.py --workers 3 --skip-collect --verify
    python scripts/generate-dutch-audio-edge.py --verify-only --skip-collect

The builder backs off on transient errors and rate limits. It stops after
repeated failures instead of flooding the service. Do not publish an incomplete
set: the manifest is written before generation to enable a parallel site build,
then every referenced file must be generated and checked.

`scripts/generate-dutch-audio.mjs` collects built-in headwords, examples, reading
sentences and paragraphs, grammar examples, model answers, demonstrations and
individual clickable words. Text keys use NFC, straight quotes, collapsed
whitespace, trimming and Dutch lowercasing. Filenames hash the text and engine
tag `edge-tts|nl-NL-FennaNeural|rate+0%|mp3-v1`, so they cannot reuse the old Piper
URLs. Temporary files and reports stay in ignored `.cache/dutch-audio`.
