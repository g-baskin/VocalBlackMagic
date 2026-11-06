"""Mirror of validateEngineJobRequest in packages/contracts/src/engine.ts.

Messages and rules must stay identical; packages/contracts/fixtures/engine-requests.json is
checked by both the TypeScript and the Python test suites. Numeric fields must be JSON numbers
(finite, never bool: Python's bool subclasses int). JavaScript `x ?? 0` treats null as absent,
and string lengths count UTF-16 code units.
"""

from __future__ import annotations

import math

MODEL_IDS: tuple[str, ...] = ("ace-step-1.5", "heartmula", "diffrhythm-2", "yue2")
TASKS: tuple[str, ...] = ("text2music", "extend", "repaint", "cover")
AUDIO_FORMATS: tuple[str, ...] = ("wav", "flac", "mp3")
MAX_PROMPT = 2000
MAX_LYRICS = 6000


def _js_len(s: str) -> int:
    return len(s.encode("utf-16-le")) // 2


def is_num(v: object) -> bool:
    return isinstance(v, int | float) and not isinstance(v, bool) and math.isfinite(v)


def _field(obj: object, key: str) -> object:
    return obj.get(key) if isinstance(obj, dict) else None


def validate_engine_job_request(body: object) -> str | None:
    """Return a plain-words reason the request is invalid, or None."""
    if not isinstance(body, dict):
        return "Body must be a JSON object."
    model = body.get("model")
    if not isinstance(model, str) or model not in MODEL_IDS:
        return "Unknown model."
    task = body.get("task")
    if not isinstance(task, str) or task not in TASKS:
        return "Unknown task."
    prompt = body.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip() or _js_len(prompt) > MAX_PROMPT:
        return f"prompt must be 1 to {MAX_PROMPT} characters."
    if "seed" in body:
        seed = body["seed"]
        if not is_num(seed) or float(seed) != math.floor(seed) or seed < 0:
            return "seed must be a non-negative integer."
    if "instrumental" in body and not isinstance(body["instrumental"], bool):
        return "instrumental must be true or false."
    if "lyrics" in body:
        lyrics = body["lyrics"]
        if not isinstance(lyrics, str) or _js_len(lyrics) > MAX_LYRICS:
            return f"lyrics must be at most {MAX_LYRICS} characters."
    if "duration_seconds" in body:
        d = body["duration_seconds"]
        if not is_num(d) or d < 5 or d > 600:
            return "duration_seconds must be 5 to 600."
    if task in ("extend", "repaint", "cover"):
        s = body.get("source_audio")
        data = _field(s, "data_b64")
        if not s or not isinstance(data, str) or not data:
            return f"{task} needs source_audio."
        fmt = _field(s, "format")
        if not isinstance(fmt, str) or fmt not in AUDIO_FORMATS:
            return "source_audio.format must be wav, flac or mp3."
    if task == "repaint":
        p = body.get("repaint")
        start, end = _field(p, "start_seconds"), _field(p, "end_seconds")
        if not p or not is_num(start) or not is_num(end) or start < 0 or end <= start:  # type: ignore[operator]
            return "repaint needs 0 <= start_seconds < end_seconds."
    if task == "extend":
        e = body.get("extend")
        b_raw, a_raw = _field(e, "before_seconds"), _field(e, "after_seconds")
        before = 0 if b_raw is None else b_raw
        after = 0 if a_raw is None else a_raw
        if (
            not is_num(before)
            or not is_num(after)
            or before < 0  # type: ignore[operator]
            or after < 0  # type: ignore[operator]
            or before + after <= 0  # type: ignore[operator]
            or before + after > 240  # type: ignore[operator]
        ):
            return "extend needs before_seconds and/or after_seconds, 240 s in total at most."
    if task == "cover":
        c = body.get("cover")
        strength = _field(c, "strength")
        if not c or not is_num(strength) or strength < 0 or strength > 1:  # type: ignore[operator]
            return "cover.strength must be 0 to 1."
    return None
