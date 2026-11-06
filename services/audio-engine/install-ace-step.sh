#!/bin/sh
# Installs ACE-Step 1.5 (MIT) at the pinned commit into the current Python environment.
# A plain `pip install git+...` fails: upstream depends on nano-vllm, which is not on PyPI and
# lives in the repo (acestep/third_parts/nano-vllm, wired through uv sources). Needs git and a
# CUDA host; upstream pins torch 2.10.0+cu128 on Linux x86_64.
set -eu
COMMIT=ca1e85fe9430179831e6bc6be790c332190a3866
SRC=${ACESTEP_SRC:-/opt/ace-step}
INDEX=${TORCH_INDEX:-https://download.pytorch.org/whl/cu128}
git clone --filter=blob:none https://github.com/ace-step/ACE-Step-1.5 "$SRC"
git -C "$SRC" checkout -q "$COMMIT"
pip install --no-cache-dir --extra-index-url "$INDEX" "$SRC/acestep/third_parts/nano-vllm"
pip install --no-cache-dir --extra-index-url "$INDEX" "$SRC"
