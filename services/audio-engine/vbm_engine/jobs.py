"""Job queue with GPU slots, idempotency, cooperative cancel and on-disk persistence.

Layout under VBM_ENGINE_DATA:
  jobs/<id>.json        job record (EngineJob plus internal fields)
  jobs/<id>/            work dir: source audio and the backend's output
"""

from __future__ import annotations

import json
import os
import shutil
import threading
import uuid
from collections import deque
from collections.abc import Callable, Mapping
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from vbm_engine.audio import AudioDecodeError, measure
from vbm_engine.backends.base import Backend, GenerationInput, JobCancelled, JobContext

TERMINAL = ("succeeded", "failed", "cancelled")


class QueueFull(Exception):
    pass


def _now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


class JobManager:
    def __init__(
        self,
        data_dir: Path,
        backends: Mapping[str, Backend],
        device: str,
        concurrency: int = 1,
        max_queue: int = 16,
        clock: Callable[[], str] = _now,
    ) -> None:
        # Absolute, so work dirs stay valid for backends that run subprocesses in another cwd.
        self._dir = data_dir.resolve() / "jobs"
        self._dir.mkdir(parents=True, exist_ok=True)
        self._backends = backends
        self.device = device
        self.concurrency = max(1, concurrency)
        self.max_queue = max(0, max_queue)
        self._clock = clock
        self._lock = threading.Lock()
        self._cv = threading.Condition(self._lock)
        self._jobs: dict[str, dict[str, Any]] = {}
        self._idem: dict[str, str] = {}
        self._queue: deque[str] = deque()
        self._inputs: dict[str, GenerationInput] = {}
        self._cancel: set[str] = set()
        self._running = 0
        self._stopped = False
        self._recover()
        self._threads = [
            threading.Thread(target=self._worker, name=f"vbm-slot-{i}", daemon=True)
            for i in range(self.concurrency)
        ]
        for t in self._threads:
            t.start()

    # ---- persistence -------------------------------------------------
    def _path(self, job_id: str) -> Path:
        return self._dir / f"{job_id}.json"

    def work_dir(self, job_id: str) -> Path:
        return self._dir / job_id

    def _save(self, job: dict[str, Any]) -> None:
        tmp = self._path(job["id"]).with_suffix(".tmp")
        tmp.write_text(json.dumps(job, sort_keys=True), encoding="utf-8")
        os.replace(tmp, self._path(job["id"]))

    def _recover(self) -> None:
        for path in sorted(self._dir.glob("*.json")):
            try:
                job = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if not isinstance(job, dict) or "id" not in job:
                continue
            if job.get("status") in ("queued", "running"):
                # Inputs are not persisted, so queued jobs cannot resume either.
                job["status"] = "failed"
                job["error"] = "interrupted by restart"
                job.pop("output", None)
                job.pop("_output_file", None)
                self._save(job)
            self._jobs[job["id"]] = job
            if job.get("_idempotency_key"):
                self._idem[job["_idempotency_key"]] = job["id"]

    # ---- public API --------------------------------------------------
    def counts(self) -> tuple[int, int]:
        with self._lock:
            return len(self._queue), self._running

    def find_idempotent(self, key: str) -> dict[str, Any] | None:
        with self._lock:
            job_id = self._idem.get(key)
            return dict(self._jobs[job_id]) if job_id else None

    def submit(
        self,
        model: str,
        inp: GenerationInput,
        idempotency_key: str | None,
        source: tuple[bytes, str] | None,
    ) -> tuple[dict[str, Any], bool]:
        """Queue a job. Returns (job, created). Raises QueueFull."""
        with self._lock:
            if idempotency_key and idempotency_key in self._idem:
                return dict(self._jobs[self._idem[idempotency_key]]), False
            if len(self._queue) >= self.max_queue:
                raise QueueFull()
            job_id = uuid.uuid4().hex
            if source is not None:
                wd = self.work_dir(job_id)
                wd.mkdir(parents=True, exist_ok=True)
                src = wd / f"source.{source[1]}"
                src.write_bytes(source[0])
                inp = GenerationInput(**{**inp.__dict__, "source_path": src})
            job: dict[str, Any] = {
                "id": job_id,
                "status": "queued",
                "model": model,
                "task": inp.task,
                "created_at": self._clock(),
                "stage": "queued",
            }
            if idempotency_key:
                job["_idempotency_key"] = idempotency_key
                self._idem[idempotency_key] = job_id
            self._jobs[job_id] = job
            self._inputs[job_id] = inp
            self._save(job)
            self._queue.append(job_id)
            self._cv.notify()
            return dict(job), True

    def get(self, job_id: str) -> dict[str, Any] | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return dict(job) if job else None

    def output_file(self, job_id: str) -> Path | None:
        job = self.get(job_id)
        if not job or job.get("status") != "succeeded" or not job.get("_output_file"):
            return None
        path = self.work_dir(job_id) / str(job["_output_file"])
        return path if path.is_file() else None

    def cancel(self, job_id: str) -> dict[str, Any] | None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            if job["status"] == "queued":
                self._queue.remove(job_id)
                self._inputs.pop(job_id, None)
                job.update(status="cancelled", stage="cancelled")
                self._save(job)
            elif job["status"] == "running":
                self._cancel.add(job_id)
                job["stage"] = "cancelling"
                self._save(job)
            return dict(job)

    def shutdown(self) -> None:
        with self._lock:
            self._stopped = True
            self._cv.notify_all()
        for t in self._threads:
            t.join(timeout=5)

    # ---- worker ------------------------------------------------------
    def _update(self, job_id: str, **fields: Any) -> None:
        with self._lock:
            job = self._jobs[job_id]
            for k, v in fields.items():
                if v is None:
                    job.pop(k, None)
                else:
                    job[k] = v
            self._save(job)

    def _worker(self) -> None:
        while True:
            with self._lock:
                while not self._queue and not self._stopped:
                    self._cv.wait()
                if self._stopped:
                    return
                job_id = self._queue.popleft()
                inp = self._inputs.pop(job_id)
                job = self._jobs[job_id]
                job.update(status="running", stage="starting", progress=0.0)
                self._save(job)
                self._running += 1
            try:
                self._run(job_id, job["model"], inp)
            finally:
                with self._lock:
                    self._running -= 1
                    self._cancel.discard(job_id)

    def _run(self, job_id: str, model: str, inp: GenerationInput) -> None:
        wd = self.work_dir(job_id)
        wd.mkdir(parents=True, exist_ok=True)

        def is_cancelled() -> bool:
            with self._lock:
                return job_id in self._cancel

        def report(progress: float | None, stage: str) -> None:
            p = None if progress is None else max(0.0, min(1.0, progress))
            self._update(job_id, progress=p, stage=stage)

        ctx = JobContext(work_dir=wd, device=self.device, report=report, is_cancelled=is_cancelled)
        try:
            out = self._backends[model].generate(inp, ctx)
            if is_cancelled():
                raise JobCancelled()
            info = measure(out)
            final = wd / f"output.{info.format}"
            if out.resolve() != final.resolve():
                shutil.move(str(out), final)
            output = {
                "audio_url": f"/v1/jobs/{job_id}/audio",
                "format": info.format,
                "duration_seconds": info.duration_seconds,
                "sample_rate": info.sample_rate,
                "seed": inp.seed,
            }
            # Commit success under the same lock cancel() takes, so a cancellation accepted
            # while the output was being measured or moved can never be overwritten by success.
            with self._lock:
                cancelled = job_id in self._cancel
                if not cancelled:
                    job = self._jobs[job_id]
                    job.update(
                        status="succeeded",
                        stage="done",
                        progress=1.0,
                        output=output,
                        _output_file=final.name,
                    )
                    self._save(job)
            if cancelled:
                raise JobCancelled()
        except JobCancelled:
            self._discard_outputs(wd)
            self._update(job_id, status="cancelled", stage="cancelled", output=None)
        except AudioDecodeError as exc:
            self._discard_outputs(wd)
            self._update(job_id, status="failed", stage="failed", error=str(exc))
        except Exception as exc:  # noqa: BLE001 - a backend failure must fail the job, not the slot
            self._discard_outputs(wd)
            msg = f"{type(exc).__name__}: {exc}"[:500]
            self._update(job_id, status="failed", stage="failed", error=msg)

    @staticmethod
    def _discard_outputs(wd: Path) -> None:
        for p in wd.glob("output.*"):
            p.unlink(missing_ok=True)


def public_view(job: dict[str, Any]) -> dict[str, Any]:
    """The EngineJob shape: drop internal fields (prefixed with '_')."""
    return {k: v for k, v in job.items() if not k.startswith("_")}
