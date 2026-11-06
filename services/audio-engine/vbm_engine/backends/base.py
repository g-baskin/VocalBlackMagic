"""Plugin interface every model backend implements.

Backends must import heavy dependencies (torch, upstream model code) lazily inside methods,
so the service and its tests run without them.
"""

from __future__ import annotations

import importlib.util
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol


class JobCancelled(Exception):
    """Raised by a backend at a step boundary when the job was cancelled."""


@dataclass(frozen=True)
class Readiness:
    installed: bool
    ready: bool
    reason: str | None = None


@dataclass(frozen=True)
class GenerationInput:
    task: str
    prompt: str
    lyrics: str
    instrumental: bool
    duration_seconds: float
    seed: int
    source_path: Path | None = None
    repaint: tuple[float, float] | None = None
    extend: tuple[float, float] | None = None
    cover_strength: float | None = None
    options: dict[str, float | int | str | bool] = field(default_factory=dict)


@dataclass
class JobContext:
    """What a running backend may use: an output dir, progress reporting, cancellation."""

    work_dir: Path
    device: str
    report: Callable[[float | None, str], None]
    is_cancelled: Callable[[], bool]

    def checkpoint(self, progress: float | None, stage: str) -> None:
        """Report progress and stop cooperatively if the job was cancelled."""
        if self.is_cancelled():
            raise JobCancelled()
        self.report(progress, stage)


class Backend(Protocol):
    id: str
    license: str
    commercial: bool
    tasks: tuple[str, ...]
    max_duration_seconds: int

    def readiness(self, device: str) -> Readiness: ...

    def generate(self, inp: GenerationInput, ctx: JobContext) -> Path:
        """Run the model and return the path of the written audio file (wav/flac/mp3)."""
        ...


def module_available(name: str) -> bool:
    try:
        return importlib.util.find_spec(name) is not None
    except (ImportError, ValueError):
        return False
