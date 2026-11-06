# VBM Engine on an NVIDIA GPU host. Build from services/audio-engine:
#   docker build --build-arg BACKEND=ace-step -t vbm-engine:ace-step .
# BACKEND: ace-step | heartmula | diffrhythm2 | yue2 | none (none = API and tests only).
# Weights are not baked in: mount a volume at /cache and run
#   docker run --gpus all -e VBM_ENGINE_TOKEN=... -v vbm-cache:/cache -p 8090:8090 vbm-engine:ace-step
#   docker run --rm -e VBM_ENGINE_TOKEN=x -v vbm-cache:/cache vbm-engine:ace-step \
#     python -m vbm_engine.download ace-step-1.5
FROM nvidia/cuda:12.8.1-cudnn-runtime-ubuntu24.04

ARG BACKEND=ace-step
ARG TORCH_INDEX=https://download.pytorch.org/whl/cu128

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/opt/venv \
    PATH=/opt/venv/bin:$PATH \
    VBM_ENGINE_CACHE=/cache \
    VBM_ENGINE_DATA=/data \
    HF_HOME=/cache/hf

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3.12 python3.12-venv git ffmpeg libsndfile1 espeak-ng curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && python3.12 -m venv /opt/venv

WORKDIR /app
COPY requirements-*.txt install-ace-step.sh ./
RUN pip install --no-cache-dir -r requirements-base.txt \
    && case "$BACKEND" in \
         none) ;; \
         ace-step) TORCH_INDEX="$TORCH_INDEX" sh install-ace-step.sh ;; \
         heartmula) pip install --no-cache-dir --extra-index-url "$TORCH_INDEX" torch torchaudio \
                    && pip install --no-cache-dir -r requirements-heartmula.txt ;; \
         diffrhythm2|yue2) pip install --no-cache-dir --extra-index-url "$TORCH_INDEX" torch torchaudio ;; \
         *) echo "unknown BACKEND=$BACKEND" >&2; exit 1 ;; \
       esac
# diffrhythm2 and yue2 finish installing from the cache after `vbm_engine.download` (see README).

COPY vbm_engine ./vbm_engine

RUN useradd --create-home --uid 10001 engine \
    && mkdir -p /cache /data \
    && chown -R engine:engine /cache /data /opt/venv
USER engine

VOLUME ["/cache", "/data"]
EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8090/v1/health -H "Host: localhost" || exit 1

# Binding 0.0.0.0 is allowed only with VBM_ENGINE_TOKEN set; the engine refuses to start without it.
CMD ["python", "-m", "vbm_engine", "--host", "0.0.0.0", "--port", "8090"]
