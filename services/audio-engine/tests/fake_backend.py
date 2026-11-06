"""Test-only backend that writes a real sine WAV. Not registered in vbm_engine.backends."""

from __future__ import annotations

import threading
from pathlib import Path

import numpy as np
import soundfile as sf

from vbm_engine.backends.base import GenerationInput, JobContext, Readiness


class FakeBackend:
    id = "ace-step-1.5"
    license = "MIT"
    commercial = True
    tasks: tuple[str, ...] = ("text2music", "repaint", "cover")
    max_duration_seconds = 20

    def __init__(self, ready: bool = True, reason: str | None = None) -> None:
        self.ready = ready
        self.reason = reason
        self.gate = threading.Event()
        self.gate.set()
        self.started = threading.Event()
        self.fail = False

    def readiness(self, device: str) -> Readiness:
        return Readiness(self.ready, self.ready, self.reason)

    def generate(self, inp: GenerationInput, ctx: JobContext) -> Path:
        self.started.set()
        ctx.checkpoint(0.1, "generating")
        self.gate.wait(10)
        ctx.checkpoint(0.9, "writing")
        if self.fail:
            raise RuntimeError("boom")
        sr = 8000
        t = np.arange(int(sr * inp.duration_seconds)) / sr
        path = ctx.work_dir / "fake.wav"
        sf.write(str(path), 0.2 * np.sin(2 * np.pi * 440 * t), sr)
        return path
