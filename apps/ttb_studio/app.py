"""Text-to-beat modular-monolith API scaffold.

No generative model is installed or invoked by this starter.
"""
from __future__ import annotations

from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from pathlib import Path

app = FastAPI(title="Vocal Black Magic — TTB Studio", version="0.1.0")
HERE = Path(__file__).resolve().parent

SoundCharacter = Literal["raw", "vintage", "live", "clean", "custom"]
Engine = Literal["ace-step", "heartmula", "external-v2"]
SongMode = Literal["instrumental", "full-song"]


class GenerationRequest(BaseModel):
    prompt: str = Field(min_length=5, max_length=3000)
    lyrics: str | None = Field(default=None, max_length=15000)
    mode: SongMode = "full-song"
    engine: Engine = "ace-step"
    sound_character: SoundCharacter = "raw"
    premium_studio: bool = False
    texture: int = Field(default=70, ge=0, le=100)
    human_variation: int = Field(default=65, ge=0, le=100)
    mastering_intensity: int = Field(default=25, ge=0, le=100)


@app.get("/")
def homepage():
    return FileResponse(HERE / "index.html")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "ttb-studio", "version": "0.1.0"}


@app.get("/api/capabilities")
def capabilities():
    return {
        "architecture": "modular-monolith",
        "engines": [
            {"id": "ace-step", "name": "ACE-Step 1.5", "status": "not-configured"},
            {"id": "heartmula", "name": "HeartMuLa", "status": "not-configured"},
            {"id": "external-v2", "name": "External V2 (provider to verify)", "status": "not-configured"},
        ],
        "sound_characters": ["raw", "vintage", "live", "clean", "custom"],
        "premium_studio": {"selectable": True, "processing_ready": False},
        "generation_ready": False,
    }


@app.post("/api/generations")
def create_generation(request: GenerationRequest):
    # Validation occurs through Pydantic. We must never return fake audio.
    raise HTTPException(
        status_code=503,
        detail="No AI music engine is configured. Install and verify a licensed model adapter before generating audio.",
    )
