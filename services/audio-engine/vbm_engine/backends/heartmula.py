"""HeartMuLa backend via heartlib (Apache-2.0).

Upstream: https://github.com/HeartMuLa/heartlib pinned at 5858ca8f1ffe58d62be7c007ea55f1033c5ca456.
API (examples/run_music_generation.py): HeartMuLaGenPipeline.from_pretrained(ckpt, device={mula,
codec}, dtype={mula,codec}, version="3B", lazy_load) then pipe({"lyrics", "tags"},
max_audio_length_ms, save_path, topk, temperature, cfg_scale). Upstream max is 240 s.
Tasks: text2music only; heartlib documents no audio-conditioned generation.
Weights (README): HeartMuLa/HeartMuLaGen -> ckpt/, HeartMuLa/HeartMuLa-oss-3B-happy-new-year ->
ckpt/HeartMuLa-oss-3B, HeartMuLa/HeartCodec-oss-20260123 -> ckpt/HeartCodec-oss.
One blocking call: cancel during it discards the output.
"""

from __future__ import annotations

import threading
from pathlib import Path
from typing import Any

from vbm_engine.backends.base import GenerationInput, JobContext, Readiness
from vbm_engine.backends.common import check

UPSTREAM_COMMIT = "5858ca8f1ffe58d62be7c007ea55f1033c5ca456"
HF_DOWNLOADS: tuple[tuple[str, str], ...] = (
    ("HeartMuLa/HeartMuLaGen", ""),
    ("HeartMuLa/HeartMuLa-oss-3B-happy-new-year", "HeartMuLa-oss-3B"),
    ("HeartMuLa/HeartCodec-oss-20260123", "HeartCodec-oss"),
)
MIN_CUDA_GB = 16.0


class HeartMuLaBackend:
    id = "heartmula"
    license = "Apache-2.0"
    commercial = True
    tasks: tuple[str, ...] = ("text2music",)
    max_duration_seconds = 240

    def __init__(self, cache_dir: Path) -> None:
        self.ckpt = cache_dir / "heartmula" / "ckpt"
        self._lock = threading.Lock()
        self._pipe: Any = None

    def readiness(self, device: str) -> Readiness:
        weights = (
            self.ckpt / "HeartMuLa-oss-3B",
            self.ckpt / "HeartCodec-oss",
            self.ckpt / "tokenizer.json",
            self.ckpt / "gen_config.json",
        )
        return check(
            ("heartlib",), "requirements-heartmula.txt", self.id, weights, device, MIN_CUDA_GB
        )

    def download(self) -> None:
        from huggingface_hub import snapshot_download

        for repo, sub in HF_DOWNLOADS:
            target = self.ckpt / sub if sub else self.ckpt
            target.mkdir(parents=True, exist_ok=True)
            snapshot_download(repo_id=repo, local_dir=str(target))

    def _load(self, device: str) -> Any:
        with self._lock:
            if self._pipe is None:
                import torch
                from heartlib import HeartMuLaGenPipeline

                dev = torch.device(device)
                mula_dtype = torch.bfloat16 if device == "cuda" else torch.float32
                self._pipe = HeartMuLaGenPipeline.from_pretrained(
                    str(self.ckpt),
                    device={"mula": dev, "codec": dev},
                    dtype={"mula": mula_dtype, "codec": torch.float32},
                    version="3B",
                    lazy_load=False,
                )
            return self._pipe

    def generate(self, inp: GenerationInput, ctx: JobContext) -> Path:
        ctx.checkpoint(0.05, "loading model")
        pipe = self._load(ctx.device)
        ctx.checkpoint(0.2, "generating")
        import torch

        out = ctx.work_dir / "heartmula.mp3"
        torch.manual_seed(inp.seed)
        with torch.no_grad():
            pipe(
                {"lyrics": "" if inp.instrumental else inp.lyrics, "tags": inp.prompt},
                max_audio_length_ms=int(inp.duration_seconds * 1000),
                save_path=str(out),
                topk=int(inp.options.get("topk", 50)),
                temperature=float(inp.options.get("temperature", 1.0)),
                cfg_scale=float(inp.options.get("cfg_scale", 3.0)),
            )
        ctx.checkpoint(0.95, "measuring output")
        return out
