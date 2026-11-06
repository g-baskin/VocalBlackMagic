# VBM Engine (services/audio-engine)

The self-hosted music engine for Vocal Black Magic. It's a Python 3.12 FastAPI service that runs open song models on your own hardware: a cloud GPU (Modal, RunPod and similar), any computer with an NVIDIA GPU, or CPU for smoke tests. TTB Studio talks to it over HTTP using [VBM Engine protocol v1](../../docs/ENGINE_PROTOCOL.md) (types and shared validation: `packages/contracts/src/engine.ts`).

**Status, honestly:** the API, auth, validation, job queue, persistence and tests are working and run in CI with a fake test backend that writes a sine WAV. The four model backends are written against each upstream's documented API, but **none has generated audio on real weights yet**. Health never reports a model as ready until its deps, weights and enough GPU memory are actually present.

## What it does

- `GET /v1/health` (no auth): device, GPU slots, queue counts, and per model `installed`, `ready`, licence, tasks and a plain-words `reason`.
- `POST /v1/jobs`, `GET /v1/jobs/{id}`, `GET /v1/jobs/{id}/audio`, `DELETE /v1/jobs/{id}`: these need `Authorization: Bearer <VBM_ENGINE_TOKEN>`.
- GPU slots (`VBM_ENGINE_CONCURRENCY`, default 1), and a bounded queue (`VBM_ENGINE_MAX_QUEUE`, default 16) that returns `429 queue_full` when full.
- `Idempotency-Key`, and cancel: a queued job is cancelled immediately; a running job is cancelled cooperatively, or its output is discarded.
- Job state and outputs are saved under `VBM_ENGINE_DATA`. Jobs that were running at a restart become `failed: interrupted by restart`.
- Source audio is limited to 50 MiB decoded. Output duration is measured from the decoded file.
- Device order: cuda, then mps, then cpu (`VBM_ENGINE_DEVICE` overrides).

Security: the engine **refuses to start without `VBM_ENGINE_TOKEN`**, on any address. When bound to localhost it also rejects any `Host` header other than `localhost`, `127.0.0.1` or `[::1]` (403), which blocks DNS-rebinding attacks from web pages.

## Configuration

| Variable                 | Default                        | Meaning                                                 |
| ------------------------ | ------------------------------ | ------------------------------------------------------- |
| `VBM_ENGINE_TOKEN`       | (required)                     | Bearer token; use a long random value                   |
| `VBM_ENGINE_CACHE`       | `services/audio-engine/.cache` | Model code and weights (git-ignored)                    |
| `VBM_ENGINE_DATA`        | `services/audio-engine/data`   | Job records and outputs (git-ignored)                   |
| `VBM_ENGINE_CONCURRENCY` | `1`                            | Jobs that run at once                                   |
| `VBM_ENGINE_MAX_QUEUE`   | `16`                           | Waiting jobs before `429`                               |
| `VBM_ENGINE_DEVICE`      | auto                           | Force `cuda`, `mps` or `cpu`                            |
| `VBM_ENGINE_ALLOW_CPU`   | off                            | Let models report ready on CPU (very slow, smoke tests) |

## Models

| Model          | Licence                               | Tasks                               | GPU memory                                            | Download (estimate) | Upstream (pinned)                                                                                           |
| -------------- | ------------------------------------- | ----------------------------------- | ----------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ace-step-1.5` | MIT                                   | text2music, extend, repaint, cover  | about 8 GB (turbo DiT + 0.6B LM)                      | about 10 GB         | `ace-step/ACE-Step-1.5` @ `ca1e85fe`                                                                        |
| `heartmula`    | Apache-2.0                            | text2music (max 240 s)              | about 16 GB (bf16; upstream lazy loading helps)       | about 16 GB         | `HeartMuLa/heartlib` @ `5858ca8f`                                                                           |
| `diffrhythm-2` | Apache-2.0                            | text2music (max 210 s)              | about 12 GB                                           | about 6 GB          | `ASLP-lab/DiffRhythm2` @ `7804f821`                                                                         |
| `yue2`         | **CC BY-NC 4.0 (non-commercial)**     | text2music                          | 24 GB NVIDIA with BF16 (upstream's stated minimum)    | about 16 GB         | `m-a-p/YuE2-3B` HF rev `8f24312f`, wheel `yue2_infer` 0.1.5                                                  |

The memory and download figures are estimates, except YuE2's 24 GB, which comes from its model card. Measure them on first real use. The download command insists on the estimate plus 5 GB free before it starts.

Notes per model:
- **ACE-Step 1.5:** extend uses upstream's repaint outpainting (`padding_utils.py` pads silence when the repaint range goes past the source), so it runs as one pass after the source and one before. Upstream has no torch for Intel Macs, so it can't run on an x86_64 Mac (torch stops at 2.2.2 there; upstream needs 2.9.1 or newer on macOS arm64, or CUDA builds).
- **HeartMuLa / DiffRhythm 2:** upstream only exposes generation from text, so they offer text2music only. DiffRhythm 2 isn't a pip package: the download clones it at the pinned commit, and it needs `espeak-ng`.
- **YuE2:** `commercial: false`. It's here for personal use, and the Studio labels it. Upstream "cover" takes a sheet-music (ABC) score and transcribed lyrics rather than audio, so it isn't offered. Song length follows the lyrics.

## Run locally

```bash
cd services/audio-engine
/usr/local/bin/python3.12 -m venv .venv
.venv/bin/pip install -r requirements-base.txt -r requirements-dev.txt
# optional, GPU machines: .venv/bin/pip install -r requirements-ace-step.txt --extra-index-url https://download.pytorch.org/whl/cu128
export VBM_ENGINE_TOKEN="$(openssl rand -hex 32)"
.venv/bin/python -m vbm_engine.download ace-step-1.5     # checks free disk first
.venv/bin/python -m vbm_engine --host 127.0.0.1 --port 8090
curl -s http://127.0.0.1:8090/v1/health
```

Checks (the same as CI, no torch needed): `bun run test:engine`, `bun run lint:engine`, `bun run check:engine`.

## Docker on any NVIDIA GPU host

Needs the NVIDIA Container Toolkit. The image doesn't contain any weights.

```bash
cd services/audio-engine
docker build --build-arg BACKEND=ace-step -t vbm-engine:ace-step .   # ace-step | heartmula | diffrhythm2 | yue2 | none
docker volume create vbm-cache
docker run --rm -e VBM_ENGINE_TOKEN=x -v vbm-cache:/cache vbm-engine:ace-step python -m vbm_engine.download ace-step-1.5
docker run -d --gpus all -e VBM_ENGINE_TOKEN="$TOKEN" -v vbm-cache:/cache -v vbm-data:/data -p 8090:8090 vbm-engine:ace-step
```

The container runs as an unprivileged user (uid 10001) and has a health check on `/v1/health`. For `diffrhythm2` and `yue2`, finish installing from the cache after downloading: `pip install -r /cache/diffrhythm-2/src/requirements.txt`, or `pip install /cache/yue2/YuE2-3B/yue2_infer-0.1.5-py3-none-any.whl`. Put this image behind HTTPS (a reverse proxy or tunnel) before exposing it beyond your own network.

## RunPod

1. Build and push the image to a registry you control (`docker push <you>/vbm-engine:ace-step`).
2. Create a **Pod** (not Serverless) from that image, with a GPU that has enough memory for the model (24 GB for YuE2).
3. Attach a network volume at `/cache`, set the environment variable `VBM_ENGINE_TOKEN`, and expose HTTP port `8090`.
4. In the pod's terminal, run `python -m vbm_engine.download <model>` once.
5. Use the pod's HTTPS proxy URL (`https://<pod-id>-8090.proxy.runpod.net`) as `VBM_ENGINE_URL`. Stop the pod when idle: a running pod bills by the hour.

## Modal

`modal_app.py` is written but **has never been deployed**. Its header has the exact deploy, download, test and teardown commands, plus expected cost: about $0.013 per minute on an L4 or $0.018 on an A10 (GPU only, list price). The GPU is chosen with `VBM_MODAL_GPU` (default `L4`) and the backend with `VBM_MODAL_BACKEND`. Weights and job data live on the volume `vbm-engine-cache`, the token comes from the Modal secret `vbm-engine-token`, and it runs a single container because the queue lives in the process.

## Connecting TTB Studio

Set these in `apps/ttb-studio/.env` (git-ignored):

```bash
VBM_ENGINE_URL=http://127.0.0.1:8090        # or the RunPod / Modal / LAN URL
VBM_ENGINE_TOKEN=<the same token the engine was started with>
```

The Studio reads `/v1/health` to show which models are ready, queues jobs with `POST /v1/jobs`, polls the job, and fetches the audio with the same bearer token. Only the Studio's server talks to the engine; the token never reaches the browser.
