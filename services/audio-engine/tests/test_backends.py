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
