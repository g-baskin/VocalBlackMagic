"""YuE2 backend (m-a-p/YuE2-3B). WEIGHTS ARE CC BY-NC 4.0: NON-COMMERCIAL (commercial: false).

Allowed here for the user's personal use; the Studio must label it. Upstream code
(github.com/multimodal-art-projection/YuE, Apache-2.0) ships the inference package as a wheel
inside the weights repo. Pinned: HF revision 8f24312f187763b9854adeec87e437e2b03bbff1, wheel
yue2_infer-0.1.5 (requirements-yue2.txt).
API (model card Quick start): YuE2Pipeline.from_pretrained(repo_or_dir, device="cuda");
song = pipe(style=..., lyrics=..., cot="full"|"melody"|"off", seed=...); song.save("x.flac").
Requirements (model card): Linux, 24 GB NVIDIA GPU with BF16.
Tasks: text2music only. Upstream "cover" takes an ABC score plus lyrics transcribed by separate
tools (SheetSage2, an ASR model), not audio, so the protocol's audio cover is not offered.
Duration: song length follows the lyrics; duration_seconds is not a control for this model.
"""

from __future__ import annotations

import threading
from pathlib import Path
from typing import Any

from vbm_engine.backends.base import GenerationInput, JobContext, Readiness
from vbm_engine.backends.common import check

HF_REPO = "m-a-p/YuE2-3B"
HF_REVISION = "8f24312f187763b9854adeec87e437e2b03bbff1"
MIN_CUDA_GB = 24.0


class YuE2Backend:
    id = "yue2"
    license = "CC-BY-NC-4.0"
    commercial = False
    tasks: tuple[str, ...] = ("text2music",)
    max_duration_seconds = 600

    def __init__(self, cache_dir: Path) -> None:
        self.weights = cache_dir / "yue2" / "YuE2-3B"
        self._lock = threading.Lock()
        self._pipe: Any = None

    def readiness(self, device: str) -> Readiness:
        return check(
            ("yue2",),
            "requirements-yue2.txt",
            self.id,
            (self.weights / "config.json",),
            device,
            MIN_CUDA_GB,
            cuda_only=True,
        )

    def download(self) -> None:
        from huggingface_hub import snapshot_download

        self.weights.mkdir(parents=True, exist_ok=True)
        snapshot_download(repo_id=HF_REPO, revision=HF_REVISION, local_dir=str(self.weights))

    def _load(self, device: str) -> Any:
        with self._lock:
            if self._pipe is None:
                from yue2 import YuE2Pipeline

                self._pipe = YuE2Pipeline.from_pretrained(str(self.weights), device=device)
            return self._pipe

    def generate(self, inp: GenerationInput, ctx: JobContext) -> Path:
        ctx.checkpoint(0.05, "loading model")
        pipe = self._load(ctx.device)
        ctx.checkpoint(0.2, "generating")
        cot = str(inp.options.get("cot", "full"))
        song = pipe(style=inp.prompt, lyrics=inp.lyrics, cot=cot, seed=inp.seed)
        out = ctx.work_dir / "yue2.flac"
        song.save(str(out))
        ctx.checkpoint(0.95, "measuring output")
        return out
