"""Backend registry. Only production backends are listed; there is no way to select a
test backend through configuration (tests inject theirs via create_app)."""

from __future__ import annotations

from pathlib import Path

from vbm_engine.backends.ace_step import AceStepBackend
from vbm_engine.backends.base import Backend
from vbm_engine.backends.diffrhythm import DiffRhythm2Backend
from vbm_engine.backends.heartmula import HeartMuLaBackend
from vbm_engine.backends.yue2 import YuE2Backend

# Rough download sizes in GB, used by the free-space check before downloading.
DOWNLOAD_GB: dict[str, float] = {
    "ace-step-1.5": 10.0,
    "heartmula": 16.0,
    "diffrhythm-2": 6.0,
    "yue2": 16.0,
}


def default_backends(cache_dir: Path) -> dict[str, Backend]:
    backends: list[Backend] = [
        AceStepBackend(cache_dir),
        HeartMuLaBackend(cache_dir),
        DiffRhythm2Backend(cache_dir),
        YuE2Backend(cache_dir),
    ]
    return {b.id: b for b in backends}
