from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from tests.fake_backend import FakeBackend
from vbm_engine.app import Settings, create_app

TOKEN = "test-token"
AUTH = {"Authorization": f"Bearer {TOKEN}"}


def make_client(data: Path, backend: FakeBackend, max_queue: int = 16) -> TestClient:
    settings = Settings(
        token=TOKEN, data_dir=data, cache_dir=data / "cache", max_queue=max_queue, device="cpu"
    )
    return TestClient(create_app(settings, {backend.id: backend}), base_url="http://localhost")


@pytest.fixture
def backend() -> FakeBackend:
    return FakeBackend()


@pytest.fixture
def client(tmp_path: Path, backend: FakeBackend) -> Iterator[TestClient]:
    with make_client(tmp_path, backend) as c:
        yield c
