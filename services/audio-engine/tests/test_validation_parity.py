from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from vbm_engine.validation import validate_engine_job_request

FIXTURE = Path(__file__).resolve().parents[3] / "packages/contracts/fixtures/engine-requests.json"
CASES: list[dict[str, Any]] = json.loads(FIXTURE.read_text(encoding="utf-8"))["cases"]


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_matches_shared_fixture(case: dict[str, Any]) -> None:
    body = case["body"]
    if "pad" in case:
        body = dict(body)
        for key, (ch, n) in case["pad"].items():
            body[key] = ch * n
    assert validate_engine_job_request(body) == case["expected"]
