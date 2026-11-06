"""Readiness checks shared by the backends."""

from __future__ import annotations

import os
from pathlib import Path

from vbm_engine.backends.base import Readiness, module_available


def allow_cpu() -> bool:
    return os.environ.get("VBM_ENGINE_ALLOW_CPU", "").strip().lower() in ("1", "true", "yes")


def check(
    modules: tuple[str, ...],
    req_file: str,
    model_id: str,
    weights: tuple[Path, ...],
    device: str,
    min_gb: float,
    cuda_only: bool = False,
) -> Readiness:
    missing = [m for m in ("torch", *modules) if not module_available(m)]
    if missing:
        return Readiness(False, False, f"deps not installed ({req_file})")
    if not all(p.exists() for p in weights):
        return Readiness(
            False, False, f"weights not downloaded (python -m vbm_engine.download {model_id})"
        )
    if device == "cuda":
        from vbm_engine.device import gpu_memory_gb

        mem = gpu_memory_gb()
        if mem is not None and mem < min_gb:
            return Readiness(True, False, f"needs about {min_gb:.0f} GB GPU memory")
    elif cuda_only:
        return Readiness(True, False, f"needs an NVIDIA GPU with about {min_gb:.0f} GB memory")
    elif device == "cpu" and not allow_cpu():
        return Readiness(True, False, "no GPU; set VBM_ENGINE_ALLOW_CPU=1 for slow CPU runs")
    return Readiness(True, True, None)
