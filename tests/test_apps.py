"""Starter HTTP contract tests. No inference and no GPU required."""
from fastapi.testclient import TestClient
from apps.vocal_fix.app import app as vocal_app
from apps.ttb_studio.app import app as ttb_app

vocal = TestClient(vocal_app)
ttb = TestClient(ttb_app)


def test_both_apps_have_health_and_independent_names():
    assert vocal.get("/api/health").json()["app"] == "vocal-fix"
    assert ttb.get("/api/health").json()["app"] == "ttb-studio"
    assert vocal.get("/").status_code == 200
    assert ttb.get("/").status_code == 200


def sample_files(n=5):
    return [("files", (f"take_{i}.wav", b"RIFF" + b"a" * 40, "audio/wav")) for i in range(n)]


def test_vocal_fix_requires_permission(tmp_path, monkeypatch):
    monkeypatch.setenv("VFM_DATA_DIR", str(tmp_path))
    response = vocal.post("/api/references", data={"voice_owner": "Authorized singer"}, files=sample_files())
    assert response.status_code == 403


def test_vocal_fix_requires_exactly_five_files(tmp_path, monkeypatch):
    monkeypatch.setenv("VFM_DATA_DIR", str(tmp_path))
    response = vocal.post("/api/references", data={"acknowledged_rights": "true", "voice_owner": "Authorized singer"}, files=sample_files(4))
    assert response.status_code == 422


def test_vocal_fix_upload_fetch_and_delete(tmp_path, monkeypatch):
    monkeypatch.setenv("VFM_DATA_DIR", str(tmp_path))
    response = vocal.post("/api/references", data={"acknowledged_rights": "true", "voice_owner": "Authorized singer"}, files=sample_files())
    assert response.status_code == 201, response.text
    body = response.json()
    assert len(body["recordings"]) == 5
    assert body["gold_vocal_ready"] is False
    session_id = body["session_id"]
    assert vocal.get("/api/references/" + session_id).status_code == 200
    assert vocal.post("/api/references/" + session_id + "/process").status_code == 501
    assert vocal.delete("/api/references/" + session_id).status_code == 200
    assert vocal.get("/api/references/" + session_id).status_code == 404


def test_ttbs_premium_studio_is_selectable_but_not_fake():
    catalog = ttb.get("/api/capabilities").json()
    assert catalog["premium_studio"]["selectable"] is True
    assert catalog["generation_ready"] is False
    response = ttb.post("/api/generations", json={
        "prompt": "Warm analog soul with live drummer and raspy vocals",
        "mode": "full-song", "sound_character": "raw", "premium_studio": True,
    })
    assert response.status_code == 503
    assert "No AI music engine" in response.json()["detail"]


def test_ttb_rejects_invalid_values():
    response = ttb.post("/api/generations", json={"prompt": "x", "texture": 120})
    assert response.status_code == 422
