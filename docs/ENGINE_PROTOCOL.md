# VBM Engine protocol v1

The contract between TTB Studio and a **self-hosted music engine** (`services/audio-engine`). It lets the Studio run open models (ACE-Step 1.5, HeartMuLa, DiffRhythm 2, YuE2) on any machine with a GPU (a cloud GPU, another computer, or CPU for smoke tests) without depending on a hosted provider. TypeScript types and shared validation live in `packages/contracts/src/engine.ts`; the Python engine mirrors them. Change both together and bump the protocol number.

## Transport and auth

- HTTP + JSON. Base URL in the Studio's `VBM_ENGINE_URL` (for example `http://127.0.0.1:8090` or a cloud URL).
- Every route except `GET /v1/health` needs `Authorization: Bearer <VBM_ENGINE_TOKEN>`. The engine refuses to start without a token, on any address: a local engine without one could be driven by any web page through DNS rebinding.
- When bound to localhost, the engine also rejects requests whose `Host` header is not `localhost`, `127.0.0.1` or `[::1]` (any port).
- Job ids match `^[A-Za-z0-9_-]{1,80}$`. Numeric fields must be JSON numbers (strings such as "5" are rejected) and `seed` must be a non-negative integer.
- Errors are `{ "detail": string, "code": EngineError["code"] }` with a matching HTTP status (401, 404, 409, 413, 422, 429, 500, 503).

## Routes

| Method and path           | Purpose                                                                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/health`          | Process, device and per-model readiness (`installed`, `ready`, licence, supported tasks, plain-words `reason`). Health never claims a model is ready unless its weights are loaded or loadable now. |
| `POST /v1/jobs`           | Queue a job (`EngineJobRequest`). Returns `202` with an `EngineJob`. An `Idempotency-Key` header returns the existing job for a repeated key instead of starting another.                           |
| `GET /v1/jobs/{id}`       | Job status, progress, stage, error, and `output` when succeeded.                                                                                                                                    |
| `GET /v1/jobs/{id}/audio` | The finished audio bytes, with the correct content type.                                                                                                                                            |
| `DELETE /v1/jobs/{id}`    | Cancel a queued or running job. Idempotent.                                                                                                                                                         |

## Tasks

| Task         | Meaning                                                                                                                                                             | Needs                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `text2music` | A new song from prompt + lyrics (or instrumental).                                                                                                                  | `prompt`, optional `lyrics`, `duration_seconds` |
| `extend`     | Add music before and/or after an existing song. A backend may do this as a repaint of silence padded onto the source, and lists `extend` only if that really works. | `source_audio`, `extend`                        |
| `repaint`    | Regenerate one time range of a song and keep the rest (Suno's "replace section").                                                                                   | `source_audio`, `repaint`                       |
| `cover`      | Keep the song's structure, restyle it with a new prompt or lyrics.                                                                                                  | `source_audio`, `cover.strength`                |

Each model lists the tasks it supports in health; asking for an unsupported task returns `422 unsupported_task`.

## Limits and guarantees

- `source_audio` is base64 in the JSON body, at most 50 MiB decoded.
- Concurrency is bounded by the engine's GPU slots; extra jobs wait as `queued`, and a full queue returns `429 queue_full`.
- Output is real decoded audio with its measured duration; a failed or cancelled job never reports an output.
- Model weights download to a cache directory outside the repository (`VBM_ENGINE_CACHE`) and are never committed.
- Non-commercial weights (YuE2: CC BY-NC 4.0) report `commercial: false`, and the Studio labels them.
