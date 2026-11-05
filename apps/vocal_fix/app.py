"""Local-only five-reference vocal workflow.

This starter accepts and securely groups recordings. It DOES NOT perform
source separation, synthesis, voice cloning, or Gold Vocal generation.
"""
from __future__ import annotations

import json
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

app = FastAPI(title="Vocal Black Magic — Vocal Fix", version="0.1.0")

MAX_FILE_BYTES = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".m4a"}
HERE = Path(__file__).resolve().parent


def root_dir() -> Path:
    path = Path(os.getenv("VFM_DATA_DIR", "data/vocal-fix")).resolve()
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    return path


def session_path(session_id: str) -> Path:
    try:
        canonical = str(UUID(session_id))
        if canonical != session_id:
            raise ValueError("Noncanonical identifier")
    except ValueError:
        raise HTTPException(status_code=404, detail="Reference session not found")
    return root_dir() / canonical


def metadata_or_404(session_id: str) -> dict:
    metadata_file = session_path(session_id) / "manifest.json"
    if not metadata_file.is_file():
        raise HTTPException(status_code=404, detail="Reference session not found")
    return json.loads(metadata_file.read_text(encoding="utf-8"))


@app.get("/")
def homepage():
    return FileResponse(HERE / "index.html")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "vocal-fix", "version": "0.1.0"}


@app.get("/api/capabilities")
def capabilities():
    return {
        "number_of_references": 5,
        "formats": sorted(ALLOWED_EXTENSIONS),
        "max_file_bytes": MAX_FILE_BYTES,
        "ingestion": "available",
        "vocal_separation": "not-implemented",
        "gold_vocal": "not-implemented",
        "prompt_generation": "not-implemented",
        "public_deployment_safe": False,
    }


@app.post("/api/references", status_code=201)
async def create_reference_session(
    files: list[UploadFile] = File(...),
    acknowledged_rights: bool = Form(False),
    voice_owner: str = Form(""),
):
    if not acknowledged_rights:
        raise HTTPException(status_code=403, detail="Speaker authorization and recording rights must be confirmed.")
    owner = voice_owner.strip()
    if not (1 <= len(owner) <= 120) or not re.search(r"\S", owner):
        raise HTTPException(status_code=422, detail="Enter the authorized vocal performer name.")
    if len(files) != 5:
        raise HTTPException(status_code=422, detail="Exactly five recordings are required.")

    session_id = str(uuid4())
    folder = root_dir() / session_id
    folder.mkdir(mode=0o700)
    recordings = []
    try:
        for index, item in enumerate(files, start=1):
            suffix = Path(item.filename or "").suffix.lower()
            if suffix not in ALLOWED_EXTENSIONS:
                raise HTTPException(status_code=415, detail=f"Recording {index}: unsupported format.")
            payload = await item.read(MAX_FILE_BYTES + 1)
            if not payload:
                raise HTTPException(status_code=422, detail=f"Recording {index}: empty file.")
            if len(payload) > MAX_FILE_BYTES:
                raise HTTPException(status_code=413, detail=f"Recording {index}: file exceeds 25 MiB.")
            # Never use an uploaded filename as a filesystem path.
            filename = f"source_{index}{suffix}"
            (folder / filename).write_bytes(payload)
            recordings.append({
                "index": index,
                "original_name": Path(item.filename or "").name,
                "stored_name": filename,
                "bytes": len(payload),
                "integrity_verified": False,
            })

        manifest = {
            "session_id": session_id,
            "voice_owner": owner,
            "acknowledged_rights": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "uploaded-awaiting-processing",
            "gold_vocal_ready": False,
            "recordings": recordings,
            "note": "Upload completed; codecs not yet verified and vocal separation is not implemented.",
        }
        output = folder / "manifest.json"
        output.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        output.chmod(0o600)
        return manifest
    except Exception:
        shutil.rmtree(folder, ignore_errors=True)
        raise
    finally:
        for item in files:
            await item.close()


@app.get("/api/references/{session_id}")
def get_reference_session(session_id: str):
    return metadata_or_404(session_id)


@app.delete("/api/references/{session_id}")
def delete_reference_session(session_id: str):
    metadata_or_404(session_id)
    shutil.rmtree(session_path(session_id))
    return {"deleted": True, "session_id": session_id}


@app.post("/api/references/{session_id}/process")
def process_reference_session(session_id: str):
    metadata_or_404(session_id)
    raise HTTPException(
        status_code=501,
        detail="Gold Vocal processing requires a licensed separation and curation pipeline; not implemented yet.",
    )
