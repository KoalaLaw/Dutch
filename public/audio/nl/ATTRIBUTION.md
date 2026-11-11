# Dutch pronunciation assets

These MP3 clips are generated from Type Dutch's built-in, original Dutch learning
texts. They are static website files: playback needs neither a paid API nor an
installed Dutch operating-system voice.

Generation uses [Piper TTS 1.8.0](https://github.com/OHF-Voice/piper1-gpl), an offline
speech synthesizer distributed under GPL-3.0, with the Netherlands Dutch voice
[`nl_NL-mls-medium`](https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_NL/mls/medium)
published by Michael Hansen / Rhasspy. A fixed speaker, MLS 7432 (speaker_id 6),
is used consistently. Output is mono MP3, 64 kbit/s, with 22,050 Hz input audio.
The synthesis length scale is 1.05 for a slightly measured learning pace.
The downloaded model's SHA-256 is
`88312e0fbf505b87caf2373d94c1384892e86b1bf2ee482cf65dc8ba179cc7d3`.

The voice's [original model card](https://huggingface.co/rhasspy/piper-voices/blob/main/nl/nl_NL/mls/medium/MODEL_CARD)
identifies its training dataset as [Multilingual LibriSpeech (OpenSLR 94)](https://www.openslr.org/94/)
under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).
Credit and source links are retained here. These are synthetic readings, not
recordings of a person reading the Type Dutch course, and no endorsement is
implied by the source authors.

## Regeneration

From the repository root, install build-only Python dependencies into the ignored
cache (Python 3.13 on Windows is supported by the chosen versions):

    python -m pip install --target .cache/dutch-audio/python piper-tts==1.8.0 lameenc==1.9.0

Download the voice model and configuration into `.cache/dutch-audio/`:

- [nl_NL-mls-medium.onnx](https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx)
- [nl_NL-mls-medium.onnx.json](https://huggingface.co/rhasspy/piper-voices/resolve/main/nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx.json)

Then run:

    python scripts/generate-dutch-audio.py --workers 6

For a complete decode/non-silence verification, install the build-only decoder
and run the verification mode:

    python -m pip install --target .cache/dutch-audio/verify-python miniaudio==1.73
    python scripts/generate-dutch-audio.py --verify-only --skip-collect

The builder collects the course's actual headwords, examples, reading sentences
and paragraphs, grammar examples, model answers, demonstration text and
individual clickable words. It writes the expected manifest up front so the
site can build while assets are prepared, then generates all referenced files.
Complete generation and verify every referenced file before publishing.
The manifest maps normalized text to root-relative URLs in `app/data/dutch-audio.json`.
Text keys use NFC, straight quotes, collapsed whitespace, trimming and Dutch
lowercasing. Asset filenames hash both text and voice-generation settings.

Generation resumes existing files. Models, temporary PCM/MP3 data, dependency
packages and generation reports stay under the ignored `.cache` directory and
are not deployed. Only this attribution, the compressed clips and manifest are
needed in the deployed site.
