from __future__ import annotations

from pathlib import Path

import pytest

from vbm_engine import download
from vbm_engine.backends import DOWNLOAD_GB, default_backends
from vbm_engine.validation import MODEL_IDS, TASKS


def test_all_models_registered_and_honest_without_deps(tmp_path: Path) -> None:
    backends = default_backends(tmp_path)
    assert sorted(backends) == sorted(MODEL_IDS) == sorted(DOWNLOAD_GB)
    for b in backends.values():
        r = b.readiness("cpu")
        assert not r.installed and not r.ready and r.reason, b.id
        assert set(b.tasks) <= set(TASKS) and "text2music" in b.tasks


def test_licences() -> None:
    b = default_backends(Path("/nonexistent"))
    assert (b["yue2"].license, b["yue2"].commercial) == ("CC-BY-NC-4.0", False)
    assert all(b[m].commercial for m in ("ace-step-1.5", "heartmula", "diffrhythm-2"))
    assert "extend" in b["ace-step-1.5"].tasks


def test_download_refuses_when_disk_is_short(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("VBM_ENGINE_CACHE", str(tmp_path / "cache"))
    monkeypatch.setattr(download, "free_gb", lambda _p: 1.0)
    assert download.main(["yue2"]) == 3
    assert "Not enough disk" in capsys.readouterr().err
    assert not (tmp_path / "cache").exists()


def test_diffrhythm_subprocess_gets_absolute_paths_and_the_download_cache(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import json

    from vbm_engine.backends import diffrhythm
    from vbm_engine.backends.base import GenerationInput, JobContext

    monkeypatch.chdir(tmp_path)
    seen: dict[str, object] = {}

    class FakeProc:
        returncode = 0

        def __init__(self, cmd: list[str], cwd: Path, env: dict[str, str]) -> None:
            seen.update(cmd=cmd, cwd=cwd, env=env)

        def poll(self) -> int:
            return 0

    monkeypatch.setattr("vbm_engine.backends.diffrhythm.subprocess.Popen", FakeProc)
    backend = diffrhythm.DiffRhythm2Backend(Path("rel-cache"))
    work = Path("rel-data") / "jobs" / "abc"
    work.mkdir(parents=True)
    ctx = JobContext(
        work_dir=work, device="cpu", report=lambda p, s: None, is_cancelled=lambda: False
    )
    inp = GenerationInput("text2music", "lofi", "[verse]\nhi", False, 30.0, 1)
    out = backend.generate(inp, ctx)

    cmd = seen["cmd"]
    assert isinstance(cmd, list)
    jsonl = Path(cmd[cmd.index("--input-jsonl") + 1])
    assert jsonl.is_absolute() and jsonl.is_file()
    assert Path(cmd[cmd.index("--output-dir") + 1]).is_absolute() and out.is_absolute()
    assert Path(json.loads(jsonl.read_text())["lyrics"]).is_absolute()
    env = seen["env"]
    assert isinstance(env, dict)
    assert env["HF_HUB_CACHE"] == str(backend.hf_home) and Path(env["HF_HUB_CACHE"]).is_absolute()


def test_ace_step_readiness_needs_every_upstream_folder(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Regression: the main HF repo ships the 1.7B LM, and upstream also needs vae/ and
    Qwen3-Embedding-0.6B/. Only the DiT plus a 0.6B LM folder must not read as installed."""
    from vbm_engine.backends import ace_step

    monkeypatch.setattr(ace_step, "module_available", lambda _name: True)
    b = ace_step.AceStepBackend(tmp_path)
    ck = b.checkpoint_dir
    for d in ("acestep-v15-turbo", "acestep-5Hz-lm-0.6B"):
        (ck / d).mkdir(parents=True)
        (ck / d / "w.safetensors").write_bytes(b"x")
    r = b.readiness("cuda")
    assert not r.installed and "weights not downloaded" in (r.reason or "")
    for d in ("acestep-5Hz-lm-1.7B", "vae", "Qwen3-Embedding-0.6B"):
        (ck / d).mkdir(parents=True)
    assert not b.readiness("cuda").installed  # empty folders are not weights
    for d in ("acestep-5Hz-lm-1.7B", "vae", "Qwen3-Embedding-0.6B"):
        (ck / d / "w.safetensors").write_bytes(b"x")
    assert b.readiness("cuda").installed
