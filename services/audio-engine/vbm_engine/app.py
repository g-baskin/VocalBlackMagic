"""FastAPI app implementing VBM Engine protocol v1 (docs/ENGINE_PROTOCOL.md)."""

from __future__ import annotations

import base64
import binascii
import hmac
import json
import os
import random
import re
from collections.abc import AsyncIterator, Awaitable, Callable, Mapping
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.exceptions import HTTPException as StarletteHTTPException

from vbm_engine import PROTOCOL_VERSION, __version__
from vbm_engine.audio import CONTENT_TYPES
from vbm_engine.backends.base import Backend, GenerationInput
from vbm_engine.jobs import JobManager, QueueFull, public_view
from vbm_engine.validation import MODEL_IDS, validate_engine_job_request

MAX_SOURCE_BYTES = 50 * 1024 * 1024
# base64 of 50 MiB plus JSON overhead; larger bodies are rejected before parsing.
MAX_BODY_BYTES = (MAX_SOURCE_BYTES * 4) // 3 + 1024 * 1024
SERVICE_ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    token: str
    data_dir: Path
    cache_dir: Path
    concurrency: int = 1
    max_queue: int = 16
    device: str | None = None
    # True when bound to a loopback address: reject foreign Host headers (DNS rebinding).
    local_bind: bool = True

    @classmethod
    def from_env(cls) -> Settings:
        return cls(
            token=os.environ.get("VBM_ENGINE_TOKEN", ""),
            data_dir=Path(os.environ.get("VBM_ENGINE_DATA", str(SERVICE_ROOT / "data"))),
            cache_dir=Path(os.environ.get("VBM_ENGINE_CACHE", str(SERVICE_ROOT / ".cache"))),
            concurrency=int(os.environ.get("VBM_ENGINE_CONCURRENCY", "1")),
            max_queue=int(os.environ.get("VBM_ENGINE_MAX_QUEUE", "16")),
        )


LOCAL_HOSTS = ("localhost", "127.0.0.1", "[::1]")
JOB_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,80}$")


def host_allowed(host: str) -> bool:
    """Host header is localhost, 127.0.0.1 or [::1], with any port."""
    h = host.strip().lower()
    if h.startswith("["):
        name = h[: h.find("]") + 1] if "]" in h else h
        rest = h[len(name) :]
    else:
        name, _, port = h.partition(":")
        rest = f":{port}" if port else ""
    if rest and not (rest.startswith(":") and rest[1:].isdigit()):
        return False
    return name in LOCAL_HOSTS


class EngineHTTPError(Exception):
    def __init__(self, status: int, code: str, detail: str) -> None:
        self.status, self.code, self.detail = status, code, detail


def _err(status: int, code: str, detail: str) -> JSONResponse:
    return JSONResponse({"detail": detail, "code": code}, status_code=status)


def create_app(settings: Settings, backends: Mapping[str, Backend] | None = None) -> FastAPI:
    from vbm_engine.device import detect_device

    if backends is None:
        from vbm_engine.backends import default_backends

        backends = default_backends(settings.cache_dir)
    device = settings.device or detect_device()
    state: dict[str, JobManager] = {}

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        state["jobs"] = JobManager(
            settings.data_dir, backends, device, settings.concurrency, settings.max_queue
        )
        try:
            yield
        finally:
            state["jobs"].shutdown()

    if not settings.token:
        raise ValueError("VBM_ENGINE_TOKEN is required.")
    app = FastAPI(title="VBM Engine", version=__version__, lifespan=lifespan)

    @app.middleware("http")
    async def _host_guard(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if settings.local_bind and not host_allowed(request.headers.get("host", "")):
            return _err(403, "unauthorized", "Host not allowed for a localhost engine.")
        return await call_next(request)

    @app.exception_handler(EngineHTTPError)
    async def _engine_err(_: Request, exc: EngineHTTPError) -> JSONResponse:
        return _err(exc.status, exc.code, exc.detail)

    @app.exception_handler(StarletteHTTPException)
    async def _http_err(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = "not_found" if exc.status_code in (404, 405) else "invalid_request"
        return _err(exc.status_code, code, str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def _val_err(_: Request, exc: RequestValidationError) -> JSONResponse:
        return _err(422, "invalid_request", "Invalid request.")

    @app.exception_handler(Exception)
    async def _internal(_: Request, exc: Exception) -> JSONResponse:
        return _err(500, "internal", "Internal engine error.")

    def check_id(job_id: str) -> None:
        if not JOB_ID_RE.match(job_id):
            raise EngineHTTPError(404, "not_found", "Job not found.")

    def require_auth(request: Request) -> None:
        header = request.headers.get("authorization", "")
        scheme, _, supplied = header.partition(" ")
        ok = scheme.lower() == "bearer" and hmac.compare_digest(
            supplied.strip().encode(), settings.token.encode()
        )
        if not ok:
            raise EngineHTTPError(401, "unauthorized", "Missing or invalid bearer token.")

    def model_info(b: Backend) -> dict[str, Any]:
        r = b.readiness(device)
        info: dict[str, Any] = {
            "id": b.id,
            "license": b.license,
            "commercial": b.commercial,
            "installed": r.installed,
            "ready": r.installed and r.ready,
            "tasks": list(b.tasks),
            "max_duration_seconds": b.max_duration_seconds,
        }
        if r.reason:
            info["reason"] = r.reason
        return info

    @app.get("/v1/health")
    def health() -> dict[str, Any]:
        queued, running = state["jobs"].counts()
        models = [model_info(backends[m]) for m in MODEL_IDS if m in backends]
        return {
            "ok": True,
            "protocol": PROTOCOL_VERSION,
            "version": __version__,
            "device": device,
            "concurrency": state["jobs"].concurrency,
            "queued": queued,
            "running": running,
            "models": models,
        }

    @app.post("/v1/jobs", status_code=202)
    async def create_job(request: Request) -> JSONResponse:
        require_auth(request)
        jobs = state["jobs"]
        key = request.headers.get("idempotency-key", "").strip()[:200] or None
        if key:
            existing = jobs.find_idempotent(key)
            if existing:
                return JSONResponse(public_view(existing), status_code=202)
        length = request.headers.get("content-length")
        if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
            raise EngineHTTPError(413, "too_large", "Request body is too large.")
        raw = await request.body()
        if len(raw) > MAX_BODY_BYTES:
            raise EngineHTTPError(413, "too_large", "Request body is too large.")
        try:
            body = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise EngineHTTPError(422, "invalid_request", "Body must be a JSON object.") from None
        reason = validate_engine_job_request(body)
        if reason:
            raise EngineHTTPError(422, "invalid_request", reason)
        assert isinstance(body, dict)
        backend = backends.get(body["model"])
        if backend is None:
            raise EngineHTTPError(503, "model_not_ready", "Model is not available on this engine.")
        if body["task"] not in backend.tasks:
            raise EngineHTTPError(
                422, "unsupported_task", f"{backend.id} does not support {body['task']}."
            )
        r = backend.readiness(device)
        if not (r.installed and r.ready):
            raise EngineHTTPError(503, "model_not_ready", r.reason or "Model is not ready.")
        source: tuple[bytes, str] | None = None
        if body["task"] != "text2music":
            src = body["source_audio"]
            data_b64: str = src["data_b64"]
            if len(data_b64) > (MAX_SOURCE_BYTES * 4) // 3 + 4:
                raise EngineHTTPError(413, "too_large", "source_audio is over 50 MiB.")
            try:
                data = base64.b64decode(data_b64, validate=True)
            except (binascii.Error, ValueError):
                raise EngineHTTPError(
                    422, "invalid_request", "source_audio.data_b64 is not valid base64."
                ) from None
            if len(data) > MAX_SOURCE_BYTES:
                raise EngineHTTPError(413, "too_large", "source_audio is over 50 MiB.")
            source = (data, src["format"])
        inp = _to_input(body, backend)
        try:
            job, _ = jobs.submit(backend.id, inp, key, source)
        except QueueFull:
            raise EngineHTTPError(429, "queue_full", "The engine queue is full.") from None
        return JSONResponse(public_view(job), status_code=202)

    @app.get("/v1/jobs/{job_id}")
    def get_job(job_id: str, request: Request) -> dict[str, Any]:
        require_auth(request)
        check_id(job_id)
        job = state["jobs"].get(job_id)
        if job is None:
            raise EngineHTTPError(404, "not_found", "Job not found.")
        return public_view(job)

    @app.get("/v1/jobs/{job_id}/audio")
    def get_audio(job_id: str, request: Request) -> FileResponse:
        require_auth(request)
        check_id(job_id)
        path = state["jobs"].output_file(job_id)
        if path is None:
            raise EngineHTTPError(404, "not_found", "No audio for this job.")
        fmt = path.suffix.lstrip(".")
        return FileResponse(path, media_type=CONTENT_TYPES[fmt], filename=f"{job_id}.{fmt}")

    @app.delete("/v1/jobs/{job_id}")
    def cancel_job(job_id: str, request: Request) -> dict[str, Any]:
        require_auth(request)
        check_id(job_id)
        job = state["jobs"].cancel(job_id)
        if job is None:
            raise EngineHTTPError(404, "not_found", "Job not found.")
        return public_view(job)

    return app


def _to_input(body: dict[str, Any], backend: Backend) -> GenerationInput:
    duration = float(body.get("duration_seconds", 30))
    duration = min(duration, float(backend.max_duration_seconds))
    seed = body.get("seed")
    if not isinstance(seed, int) or isinstance(seed, bool):
        seed = random.SystemRandom().randrange(0, 2**31 - 1)
    lyrics = body.get("lyrics") or ""
    repaint: dict[str, Any] = body.get("repaint") or {}
    extend: dict[str, Any] = body.get("extend") or {}
    cover: dict[str, Any] = body.get("cover") or {}
    raw_opts = body.get("options")
    opts = {
        k: v
        for k, v in (raw_opts.items() if isinstance(raw_opts, dict) else [])
        if isinstance(v, int | float | str | bool)
    }
    return GenerationInput(
        task=body["task"],
        prompt=body["prompt"],
        lyrics=lyrics,
        instrumental=bool(body.get("instrumental")) or not lyrics.strip(),
        duration_seconds=duration,
        seed=seed,
        repaint=(float(repaint["start_seconds"]), float(repaint["end_seconds"]))
        if body["task"] == "repaint"
        else None,
        extend=(
            float(extend.get("before_seconds") or 0),
            float(extend.get("after_seconds") or 0),
        )
        if body["task"] == "extend"
        else None,
        cover_strength=float(cover["strength"]) if body["task"] == "cover" else None,
        options=opts,
    )
