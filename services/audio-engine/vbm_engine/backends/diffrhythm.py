"""DiffRhythm 2 backend (ASLP-lab, Apache-2.0), run as the upstream inference script.

Upstream: https://github.com/ASLP-lab/DiffRhythm2 pinned at
7804f821b797b4f276090e1a9dcd37e97d9915d5. It is not a pip package: clone it at that commit
to VBM_ENGINE_CACHE/diffrhythm-2/src (python -m vbm_engine.download diffrhythm-2 does it),
install its requirements.txt, and have espeak-ng on PATH (inference.sh checks it).
Invocation (inference.sh): python inference.py --repo-id ASLP-lab/DiffRhythm2 --output-dir D
--input-jsonl F --cfg-strength 2.0 [--max-secs 210 --steps 16]; JSONL rows
{"song_name", "style_prompt", "lyrics": <path to .lrc>}; output D/<song_name>.mp3.
Tasks: text2music only (the demo code has no edit/extend entry point).
Cancel: the subprocess is terminated when the flag is seen (polled every second).
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

from vbm_engine.backends.base import GenerationInput, JobCancelled, JobContext, Readiness
from vbm_engine.backends.common import check

UPSTREAM_REPO = "https://github.com/ASLP-lab/DiffRhythm2"
UPSTREAM_COMMIT = "7804f821b797b4f276090e1a9dcd37e97d9915d5"
HF_REPO = "ASLP-lab/DiffRhythm2"
MIN_CUDA_GB = 12.0


class DiffRhythm2Backend:
    id = "diffrhythm-2"
    license = "Apache-2.0"
    commercial = True
    tasks: tuple[str, ...] = ("text2music",)
    max_duration_seconds = 210

    def __init__(self, cache_dir: Path) -> None:
        self.root = cache_dir.resolve() / "diffrhythm-2"
        self.src = self.root / "src"
        self.hf_home = self.root / "hf"

    def readiness(self, device: str) -> Readiness:
        if not (self.src / "inference.py").is_file():
            return Readiness(
                False,
                False,
                f"upstream code not downloaded (python -m vbm_engine.download {self.id})",
            )
        if shutil.which("espeak-ng") is None:
            return Readiness(False, False, "deps not installed (espeak-ng missing)")
        return check(
            (),
            "requirements-diffrhythm2.txt",
            self.id,
            (self.hf_home,),
            device,
            MIN_CUDA_GB,
        )

    def download(self) -> None:
        if not (self.src / ".git").is_dir():
            self.root.mkdir(parents=True, exist_ok=True)
            subprocess.run(["git", "clone", UPSTREAM_REPO, str(self.src)], check=True)
        subprocess.run(["git", "-C", str(self.src), "checkout", UPSTREAM_COMMIT], check=True)
        from huggingface_hub import snapshot_download

        snapshot_download(repo_id=HF_REPO, cache_dir=str(self.hf_home))

    def generate(self, inp: GenerationInput, ctx: JobContext) -> Path:
        ctx.checkpoint(0.05, "starting DiffRhythm 2")
        # The subprocess runs with cwd=self.src, so every path handed to it must be absolute.
        work_dir = ctx.work_dir.resolve()
        out_dir = work_dir / "dr2"
        out_dir.mkdir(parents=True, exist_ok=True)
        lrc = work_dir / "lyrics.lrc"
        lrc.write_text("" if inp.instrumental else inp.lyrics, encoding="utf-8")
        jsonl = work_dir / "input.jsonl"
        row = {"song_name": "song", "style_prompt": inp.prompt, "lyrics": str(lrc)}
        jsonl.write_text(json.dumps(row) + "\n", encoding="utf-8")
        cmd = [
            sys.executable,
            "inference.py",
            "--repo-id",
            HF_REPO,
            "--output-dir",
            str(out_dir),
            "--input-jsonl",
            str(jsonl),
            "--cfg-strength",
            str(float(inp.options.get("cfg_strength", 2.0))),
            "--max-secs",
            str(float(inp.duration_seconds)),
            "--steps",
            str(int(inp.options.get("steps", 16))),
        ]
        env = {
            **_base_env(),
            "PYTHONPATH": str(self.src),
            "HF_HOME": str(self.hf_home),
            # download() uses snapshot_download(cache_dir=hf_home), which stores models directly
            # under hf_home; point the hub cache there too so inference reuses those weights.
            "HF_HUB_CACHE": str(self.hf_home),
            "CUDA_VISIBLE_DEVICES": _cuda_env(ctx.device),
        }
        ctx.checkpoint(0.2, "generating")
        proc = subprocess.Popen(cmd, cwd=self.src, env=env)
        while proc.poll() is None:
            if ctx.is_cancelled():
                proc.terminate()
                proc.wait(timeout=30)
                raise JobCancelled()
            time.sleep(1)
        if proc.returncode != 0:
            raise RuntimeError(f"DiffRhythm 2 exited with code {proc.returncode}")
        ctx.checkpoint(0.95, "measuring output")
        return out_dir / "song.mp3"


def _base_env() -> dict[str, str]:
    import os

    return dict(os.environ)


def _cuda_env(device: str) -> str:
    import os

    return os.environ.get("CUDA_VISIBLE_DEVICES", "0") if device == "cuda" else ""
