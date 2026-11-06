"""Device choice: cuda, then mps, then cpu. torch is optional."""

from __future__ import annotations

import os

from vbm_engine.backends.base import module_available


def detect_device() -> str:
    forced = os.environ.get("VBM_ENGINE_DEVICE", "").strip().lower()
    if forced in ("cuda", "mps", "cpu"):
        return forced
    if not module_available("torch"):
        return "cpu"
    import torch

    if torch.cuda.is_available():
        return "cuda"
    mps = getattr(torch.backends, "mps", None)
    if mps is not None and mps.is_available():
        return "mps"
    return "cpu"


def gpu_memory_gb() -> float | None:
    """Total memory of CUDA device 0 in GB, or None when there is no CUDA device."""
    if not module_available("torch"):
        return None
    import torch

    if not torch.cuda.is_available():
        return None
    return float(torch.cuda.get_device_properties(0).total_memory) / 1e9
