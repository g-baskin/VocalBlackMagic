"""VBM Engine on Modal (serverless GPU). NOT DEPLOYED: running these commands spends money.

Setup, from services/audio-engine, with the Modal CLI in this project's venv
(.venv/bin/pip install modal) and `modal token new` done by the account owner:

  modal secret create vbm-engine-token VBM_ENGINE_TOKEN="$(openssl rand -hex 32)"
  VBM_MODAL_GPU=L4 VBM_MODAL_BACKEND=ace-step modal deploy modal_app.py
  # Download weights into the volume once (runs on a GPU container, billed while it runs):
  modal run modal_app.py::download --model ace-step-1.5

Test (the URL is printed by `modal deploy`):

  curl -s https://<workspace>--vbm-engine-web.modal.run/v1/health
  curl -s -X POST https://<...>.modal.run/v1/jobs -H "Authorization: Bearer $TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"model":"ace-step-1.5","task":"text2music","prompt":"lofi piano","duration_seconds":10}'

Teardown (stops all billing; the volume keeps the weights until deleted):

  modal app stop vbm-engine
  modal volume delete vbm-engine-cache     # optional: also deletes downloaded weights

Expected cost (Modal list prices, about late 2026, GPU only): L4 $0.000222/s, about
$0.013 per minute ($0.80/h); A10 $0.000306/s, about $0.018 per minute ($1.10/h). CPU, memory and
volume storage are billed separately, and region or non-preemptible multipliers can raise it.
You pay while a container is up, including SCALEDOWN_SECONDS of idle time after the last request.
YuE2 needs a 24 GB card (L4 and A10 qualify, though more headroom helps); check modal.com/pricing.

Design: one container at most (max_containers=1), because the job queue lives in the process
and the GPU slots are counted per container. Job state and outputs are on the volume
(/cache/data), so they survive container restarts; jobs running at a restart become failed.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

try:
    import modal
except ImportError:  # importable without modal (tests, mypy, CI)
    modal = None

APP_NAME = "vbm-engine"
GPU = os.environ.get("VBM_MODAL_GPU", "L4")
BACKEND = os.environ.get("VBM_MODAL_BACKEND", "ace-step")
SCALEDOWN_SECONDS = int(os.environ.get("VBM_MODAL_SCALEDOWN", "300"))
CACHE = "/cache"
HERE = Path(__file__).resolve().parent
TORCH_INDEX = "https://download.pytorch.org/whl/cu128"

BACKEND_REQS = {
    "ace-step": ["requirements-ace-step.txt"],
    "heartmula": ["requirements-heartmula.txt"],
    "diffrhythm2": [],
    "yue2": [],
    "none": [],
}


def _image() -> Any:
    assert modal is not None
    if BACKEND not in BACKEND_REQS:
        raise ValueError(f"unknown VBM_MODAL_BACKEND={BACKEND}")
    img = (
        modal.Image.from_registry("nvidia/cuda:12.8.1-cudnn-runtime-ubuntu24.04", add_python="3.12")
        .apt_install("git", "ffmpeg", "libsndfile1", "espeak-ng")
        .pip_install_from_requirements(str(HERE / "requirements-base.txt"))
    )
    if BACKEND != "none":
        img = img.pip_install("torch", "torchaudio", extra_index_url=TORCH_INDEX)
    for req in BACKEND_REQS[BACKEND]:
        img = img.pip_install_from_requirements(str(HERE / req), extra_index_url=TORCH_INDEX)
    return img.env(
        {
            "VBM_ENGINE_CACHE": CACHE,
            "VBM_ENGINE_DATA": f"{CACHE}/data",
            "HF_HOME": f"{CACHE}/hf",
        }
    ).add_local_python_source("vbm_engine")


if modal is not None:
    app = modal.App(APP_NAME)
    volume = modal.Volume.from_name("vbm-engine-cache", create_if_missing=True)
    secret = modal.Secret.from_name("vbm-engine-token")
    image = _image()

    @app.function(
        image=image,
        gpu=GPU,
        volumes={CACHE: volume},
        secrets=[secret],
        max_containers=1,
        scaledown_window=SCALEDOWN_SECONDS,
        timeout=3600,
    )
    @modal.concurrent(max_inputs=32)
    @modal.asgi_app()
    def web() -> Any:
        from dataclasses import replace

        from vbm_engine.app import Settings, create_app

        # Public URL: token required (create_app refuses without one); no localhost Host guard.
        return create_app(replace(Settings.from_env(), local_bind=False))

    @app.function(image=image, gpu=GPU, volumes={CACHE: volume}, secrets=[secret], timeout=7200)
    def download(model: str) -> None:
        from vbm_engine.download import main

        code = main([model])
        volume.commit()
        if code != 0:
            raise SystemExit(code)
