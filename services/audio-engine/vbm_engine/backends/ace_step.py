"""ACE-Step 1.5 backend (MIT), via the official upstream Python API.

Upstream: https://github.com/ace-step/ACE-Step-1.5 pinned at commit
ca1e85fe9430179831e6bc6be790c332190a3866 (see requirements-ace-step.txt).
API used (acestep/inference.py, docs/en/INFERENCE.md at that commit):
  AceStepHandler().initialize_service(project_root, config_path, device)
  LLMHandler().initialize(checkpoint_dir, lm_model_path, backend, device)
  generate_music(dit, llm, GenerationParams(...), GenerationConfig(...), save_dir)
    -> GenerationResult(success, error, audios=[{"path", "params": {"seed"}}])

Tasks: text2music, repaint (repainting_start/end, chunk_mask_mode="explicit"), cover
(src_audio + audio_cover_strength) and extend. Extend is outpainting through repaint:
upstream acestep/core/generation/handler/padding_utils.py (same commit) pads the source
with silence when repainting_start < 0 (left) or repainting_end > source length (right),
then regenerates only that range. "after" is repaint [len, len + after]; "before" is
repaint [-before, 0]; both run as two passes (after first, then before on the result).

Cancellation: generate_music is one blocking call; the flag is checked before loading and
before generating, and a cancel during generation discards the output (JobManager).
"""

from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Any

from vbm_engine.backends.base import GenerationInput, JobContext, Readiness, module_available

UPSTREAM_COMMIT = "ca1e85fe9430179831e6bc6be790c332190a3866"
HF_REPO = "ACE-Step/Ace-Step1.5"
HF_REVISION = "19671f406d603126926c1b7e2adc169acbcade22"
DIT_CONFIG = "acestep-v15-turbo"
# The main repo ships the 1.7B LM (upstream DEFAULT_LM_MODEL); 0.6B lives in a separate repo.
LM_MODEL = "acestep-5Hz-lm-1.7B"
# Folders upstream's _ensure_models_present expects under checkpoints/ (MAIN_MODEL_COMPONENTS).
REQUIRED_DIRS = (DIT_CONFIG, LM_MODEL, "vae", "Qwen3-Embedding-0.6B")
MIN_CUDA_GB = 12.0


class AceStepBackend:
    id = "ace-step-1.5"
    license = "MIT"
    commercial = True
    tasks: tuple[str, ...] = ("text2music", "extend", "repaint", "cover")
    max_duration_seconds = 600

    def __init__(self, cache_dir: Path) -> None:
        self.checkpoint_dir = cache_dir / "ace-step-1.5" / "checkpoints"
        self._lock = threading.Lock()
        self._dit: Any = None
        self._llm: Any = None

    def _weights_present(self) -> bool:
        return all(
            (self.checkpoint_dir / d).is_dir() and any((self.checkpoint_dir / d).iterdir())
            for d in REQUIRED_DIRS
        )

    def readiness(self, device: str) -> Readiness:
        if not module_available("acestep") or not module_available("torch"):
            return Readiness(False, False, "deps not installed (requirements-ace-step.txt)")
        if not self._weights_present():
            return Readiness(False, False, "weights not downloaded (python -m vbm_engine.download)")
        if device == "cuda":
            from vbm_engine.device import gpu_memory_gb

            mem = gpu_memory_gb()
            if mem is not None and mem < MIN_CUDA_GB:
                return Readiness(True, False, f"needs about {MIN_CUDA_GB:.0f} GB GPU memory")
        if device == "cpu" and not _env_flag("VBM_ENGINE_ALLOW_CPU"):
            return Readiness(True, False, "no GPU; set VBM_ENGINE_ALLOW_CPU=1 for slow CPU runs")
        return Readiness(True, True, None)

    def download(self) -> None:
        from huggingface_hub import snapshot_download

        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        snapshot_download(repo_id=HF_REPO, revision=HF_REVISION, local_dir=str(self.checkpoint_dir))

    def _load(self, device: str) -> tuple[Any, Any]:
        with self._lock:
            if self._dit is None:
                from acestep.handler import AceStepHandler
                from acestep.llm_inference import LLMHandler

                dit = AceStepHandler()
                dit.initialize_service(
                    project_root=str(self.checkpoint_dir.parent),
                    config_path=DIT_CONFIG,
                    device=device,
                )
                llm = LLMHandler()
                llm.initialize(
                    checkpoint_dir=str(self.checkpoint_dir),
                    lm_model_path=LM_MODEL,
                    # "pt" by default: nano-vllm needs flash-attn wheels that exist only for
                    # Python 3.11; VBM_ACESTEP_LM_BACKEND=vllm opts in.
                    backend=os.environ.get("VBM_ACESTEP_LM_BACKEND", "pt"),
                    device=device,
                )
                self._dit, self._llm = dit, llm
            return self._dit, self._llm

    def generate(self, inp: GenerationInput, ctx: JobContext) -> Path:
        ctx.checkpoint(0.05, "loading model")
        dit, llm = self._load(ctx.device)
        if inp.task != "extend":
            ctx.checkpoint(0.2, "generating")
            out = self._run(dit, llm, inp, inp.task, str(inp.source_path), None, ctx)
            ctx.checkpoint(0.95, "measuring output")
            return out
        before, after = inp.extend or (0.0, 0.0)
        src = str(inp.source_path)
        if after > 0:
            ctx.checkpoint(0.2, "extending after")
            length = _duration(src)
            src = str(self._run(dit, llm, inp, "repaint", src, (length, length + after), ctx))
        if before > 0:
            ctx.checkpoint(0.55, "extending before")
            src = str(self._run(dit, llm, inp, "repaint", src, (-before, 0.0), ctx))
        ctx.checkpoint(0.95, "measuring output")
        return Path(src)

    def _run(
        self,
        dit: Any,
        llm: Any,
        inp: GenerationInput,
        task: str,
        src: str,
        span: tuple[float, float] | None,
        ctx: JobContext,
    ) -> Path:
        from acestep.inference import GenerationConfig, GenerationParams, generate_music

        params: dict[str, Any] = {
            "task_type": task,
            "caption": inp.prompt,
            "lyrics": "" if inp.instrumental else inp.lyrics,
            "instrumental": inp.instrumental or not inp.lyrics.strip(),
            "seed": inp.seed,
        }
        if task == "text2music":
            params["duration"] = float(inp.duration_seconds)
        else:
            params["src_audio"] = src
        span = span or (inp.repaint if task == "repaint" else None)
        if task == "repaint" and span:
            params["repainting_start"], params["repainting_end"] = span
            params["chunk_mask_mode"] = "explicit"
        if task == "cover" and inp.cover_strength is not None:
            # Protocol: 0 keeps everything, 1 ignores source. Upstream: higher = closer to source.
            params["audio_cover_strength"] = 1.0 - inp.cover_strength
        for key in ("inference_steps", "guidance_scale", "shift", "bpm"):
            if key in inp.options:
                params[key] = inp.options[key]
        config = GenerationConfig(
            batch_size=1, use_random_seed=False, seeds=[inp.seed], audio_format="wav"
        )
        save = ctx.work_dir / f"pass-{task}-{len(list(ctx.work_dir.glob('pass-*')))}"
        save.mkdir(parents=True, exist_ok=True)
        result = generate_music(dit, llm, GenerationParams(**params), config, save_dir=str(save))
        if not result.success or not result.audios:
            raise RuntimeError(result.error or "ACE-Step returned no audio")
        return Path(result.audios[0]["path"])


def _duration(path: str) -> float:
    import soundfile as sf

    info = sf.info(path)
    return float(info.frames) / float(info.samplerate)


def _env_flag(name: str) -> bool:
    import os

    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes")
