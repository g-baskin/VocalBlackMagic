"""Decode and measure real audio files (never trust a backend's claimed duration)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import soundfile as sf

CONTENT_TYPES = {"wav": "audio/wav", "flac": "audio/flac", "mp3": "audio/mpeg"}


class AudioDecodeError(ValueError):
    pass


@dataclass(frozen=True)
class AudioInfo:
    format: str
    duration_seconds: float
    sample_rate: int


def measure(path: Path) -> AudioInfo:
    """Open the file with libsndfile and measure it; raise AudioDecodeError if it is not audio."""
    fmt = path.suffix.lower().lstrip(".")
    if fmt not in CONTENT_TYPES:
        raise AudioDecodeError(f"unsupported output format: {fmt}")
    try:
        info = sf.info(str(path))
    except (RuntimeError, sf.LibsndfileError) as exc:
        raise AudioDecodeError(f"output is not decodable audio: {exc}") from exc
    if info.frames <= 0 or info.samplerate <= 0:
        raise AudioDecodeError("output audio is empty")
    return AudioInfo(fmt, round(info.frames / info.samplerate, 3), int(info.samplerate))
