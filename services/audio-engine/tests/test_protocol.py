from __future__ import annotations

import base64
import io
import re
import time
from pathlib import Path
from typing import Any

import numpy as np
import pytest
import soundfile as sf
from fastapi.testclient import TestClient

from tests.conftest import AUTH, TOKEN, make_client
from tests.fake_backend import FakeBackend
from vbm_engine.__main__ import is_local_host, main
from vbm_engine.app import Settings, create_app
from vbm_engine.backends import default_backends

BODY = {"model": "ace-step-1.5", "task": "text2music", "prompt": "lofi", "duration_seconds": 5}


def wait(client: TestClient, job_id: str, statuses: tuple[str, ...]) -> dict[str, Any]:
    for _ in range(200):
        job: dict[str, Any] = client.get(f"/v1/jobs/{job_id}", headers=AUTH).json()
        if job["status"] in statuses:
            return job
        time.sleep(0.02)
    raise AssertionError(f"job never reached {statuses}")


def wav_b64() -> str:
    buf = io.BytesIO()
    sf.write(buf, np.zeros(8000), 8000, format="WAV")
    return base64.b64encode(buf.getvalue()).decode()


def test_health_is_public_and_honest(client: TestClient) -> None:
    h = client.get("/v1/health").json()
    assert h["protocol"] == 1 and h["device"] == "cpu" and h["concurrency"] == 1
    assert h["models"][0]["id"] == "ace-step-1.5" and h["models"][0]["ready"] is True


def test_health_reports_not_ready(tmp_path: Path) -> None:
    b = FakeBackend(ready=False, reason="weights not downloaded")
    with make_client(tmp_path, b) as c:
        m = c.get("/v1/health").json()["models"][0]
        assert (m["installed"], m["ready"], m["reason"]) == (False, False, "weights not downloaded")
        r = c.post("/v1/jobs", json=BODY, headers=AUTH)
        assert r.status_code == 503 and r.json()["code"] == "model_not_ready"


def test_real_backend_health_without_deps(tmp_path: Path) -> None:
    b = default_backends(tmp_path)["ace-step-1.5"]
    r = b.readiness("cpu")
    assert not r.ready and r.reason


def test_auth_required(client: TestClient) -> None:
    for headers in ({}, {"Authorization": "Bearer wrong"}, {"Authorization": "test-token"}):
        r = client.post("/v1/jobs", json=BODY, headers=headers)
        assert r.status_code == 401 and r.json()["code"] == "unauthorized"
    assert client.get("/v1/jobs/x", headers={}).status_code == 401


def test_refuses_to_start_without_token(monkeypatch: Any, tmp_path: Path) -> None:
    monkeypatch.delenv("VBM_ENGINE_TOKEN", raising=False)
    assert main(["--host", "0.0.0.0"]) == 2
    assert main(["--host", "127.0.0.1"]) == 2
    with pytest.raises(ValueError):
        create_app(Settings(token="", data_dir=tmp_path, cache_dir=tmp_path), {})


def test_host_header_guard(client: TestClient) -> None:
    for host in ("localhost", "localhost:8090", "127.0.0.1:1", "[::1]:8090", "[::1]"):
        assert client.get("/v1/health", headers={"Host": host}).status_code == 200, host
    for host in ("evil.com", "localhost.evil.com", "127.0.0.1.nip.io:8090", "[::1]x", ""):
        r = client.get("/v1/health", headers={"Host": host})
        assert r.status_code == 403 and r.json()["code"] == "unauthorized", host


def test_host_guard_off_for_public_bind(tmp_path: Path) -> None:
    s = Settings(token=TOKEN, data_dir=tmp_path, cache_dir=tmp_path, device="cpu", local_bind=False)
    with TestClient(create_app(s, {"ace-step-1.5": FakeBackend()})) as c:
        assert c.get("/v1/health", headers={"Host": "engine.example.com"}).status_code == 200
    assert is_local_host("127.0.0.1") and is_local_host("::1") and not is_local_host("0.0.0.0")


def test_job_succeeds_with_measured_audio(client: TestClient) -> None:
    r = client.post("/v1/jobs", json={**BODY, "seed": 3}, headers=AUTH)
    assert r.status_code == 202 and r.json()["status"] in ("queued", "running")
    assert re.fullmatch(r"[A-Za-z0-9_-]{1,80}", r.json()["id"])
    assert client.get("/v1/jobs/bad.id!", headers=AUTH).status_code == 404
    job = wait(client, r.json()["id"], ("succeeded", "failed"))
    assert job["status"] == "succeeded", job
    out = job["output"]
    assert out["duration_seconds"] == 5.0 and out["sample_rate"] == 8000 and out["seed"] == 3
    audio = client.get(out["audio_url"], headers=AUTH)
    assert audio.status_code == 200 and audio.headers["content-type"] == "audio/wav"
    assert sf.info(io.BytesIO(audio.content)).frames == 40000


def test_duration_clamped_to_model_max(client: TestClient) -> None:
    r = client.post("/v1/jobs", json={**BODY, "duration_seconds": 300}, headers=AUTH)
    job = wait(client, r.json()["id"], ("succeeded",))
    assert job["output"]["duration_seconds"] == 20.0


def test_validation_and_unsupported_task(client: TestClient) -> None:
    r = client.post("/v1/jobs", json={**BODY, "prompt": ""}, headers=AUTH)
    assert r.status_code == 422 and r.json()["code"] == "invalid_request"
    ext = {**BODY, "task": "extend", "source_audio": {"data_b64": wav_b64(), "format": "wav"}}
    r = client.post("/v1/jobs", json={**ext, "extend": {"after_seconds": 5}}, headers=AUTH)
    assert r.status_code == 422 and r.json()["code"] == "unsupported_task"
    r = client.post("/v1/jobs", content=b"{nope", headers=AUTH)
    assert r.status_code == 422


def test_source_audio_limits(client: TestClient) -> None:
    cover = {**BODY, "task": "cover", "cover": {"strength": 0.5}}
    big = base64.b64encode(b"\0" * (50 * 1024 * 1024 + 3)).decode()
    r = client.post(
        "/v1/jobs", json={**cover, "source_audio": {"data_b64": big, "format": "wav"}}, headers=AUTH
    )
    assert r.status_code == 413 and r.json()["code"] == "too_large"
    r = client.post(
        "/v1/jobs",
        json={**cover, "source_audio": {"data_b64": "@@@", "format": "wav"}},
        headers=AUTH,
    )
    assert r.status_code == 422
    ok = {**cover, "source_audio": {"data_b64": wav_b64(), "format": "wav"}}
    r = client.post("/v1/jobs", json=ok, headers=AUTH)
    assert wait(client, r.json()["id"], ("succeeded",))["task"] == "cover"


def test_idempotency(client: TestClient) -> None:
    h = {**AUTH, "Idempotency-Key": "abc"}
    a = client.post("/v1/jobs", json=BODY, headers=h).json()
    b = client.post("/v1/jobs", json=BODY, headers=h).json()
    assert a["id"] == b["id"]
    c = client.post("/v1/jobs", json=BODY, headers=AUTH).json()
    assert c["id"] != a["id"]


def test_cancel_queued_and_running(client: TestClient, backend: FakeBackend) -> None:
    backend.gate.clear()
    running = client.post("/v1/jobs", json=BODY, headers=AUTH).json()["id"]
    assert backend.started.wait(5)
    queued = client.post("/v1/jobs", json=BODY, headers=AUTH).json()["id"]
    r = client.delete(f"/v1/jobs/{queued}", headers=AUTH)
    assert r.status_code == 200 and r.json()["status"] == "cancelled"
    assert client.delete(f"/v1/jobs/{queued}", headers=AUTH).json()["status"] == "cancelled"
    client.delete(f"/v1/jobs/{running}", headers=AUTH)
    backend.gate.set()
    job = wait(client, running, ("cancelled", "succeeded", "failed"))
    assert job["status"] == "cancelled" and "output" not in job
    assert client.get(f"/v1/jobs/{running}/audio", headers=AUTH).status_code == 404
    assert client.delete("/v1/jobs/nope", headers=AUTH).json()["code"] == "not_found"


def test_cancel_during_output_measurement_is_never_overwritten_by_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import threading

    from vbm_engine.audio import measure as real_measure

    measuring, release = threading.Event(), threading.Event()

    def slow_measure(path: Path) -> Any:
        measuring.set()
        release.wait(5)
        return real_measure(path)

    monkeypatch.setattr("vbm_engine.jobs.measure", slow_measure)
    job_id = client.post("/v1/jobs", json=BODY, headers=AUTH).json()["id"]
    assert measuring.wait(5)
    assert client.delete(f"/v1/jobs/{job_id}", headers=AUTH).json()["stage"] == "cancelling"
    release.set()
    job = wait(client, job_id, ("cancelled", "succeeded", "failed"))
    assert job["status"] == "cancelled" and "output" not in job
    assert client.get(f"/v1/jobs/{job_id}/audio", headers=AUTH).status_code == 404


def test_backend_failure_reports_no_output(client: TestClient, backend: FakeBackend) -> None:
    backend.fail = True
    job_id = client.post("/v1/jobs", json=BODY, headers=AUTH).json()["id"]
    job = wait(client, job_id, ("failed",))
    assert "boom" in job["error"] and "output" not in job


def test_queue_full(tmp_path: Path) -> None:
    b = FakeBackend()
    b.gate.clear()
    with make_client(tmp_path, b, max_queue=1) as c:
        c.post("/v1/jobs", json=BODY, headers=AUTH)
        assert b.started.wait(5)
        assert c.post("/v1/jobs", json=BODY, headers=AUTH).status_code == 202
        r = c.post("/v1/jobs", json=BODY, headers=AUTH)
        assert r.status_code == 429 and r.json()["code"] == "queue_full"
        assert c.get("/v1/health").json()["queued"] == 1
        b.gate.set()


def test_restart_recovery(tmp_path: Path) -> None:
    b = FakeBackend()
    b.gate.clear()
    with make_client(tmp_path, b) as c:
        done_b = FakeBackend()
        running = c.post("/v1/jobs", json=BODY, headers=AUTH).json()["id"]
        assert b.started.wait(5)
        queued = c.post("/v1/jobs", json=BODY, headers={**AUTH, "Idempotency-Key": "k"}).json()[
            "id"
        ]
        # Simulate a crash: the record still says running/queued when a new process starts.
        with make_client(tmp_path, done_b) as c2:
            for job_id in (running, queued):
                job = c2.get(f"/v1/jobs/{job_id}", headers=AUTH).json()
                assert job["status"] == "failed" and job["error"] == "interrupted by restart"
            again = c2.post("/v1/jobs", json=BODY, headers={**AUTH, "Idempotency-Key": "k"})
            assert again.json()["id"] == queued
        b.gate.set()
