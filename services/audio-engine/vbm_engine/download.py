"""Download a model's weights into VBM_ENGINE_CACHE: python -m vbm_engine.download <model>.

Refuses to start unless the cache's disk has the model's estimated size plus a margin free.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from vbm_engine.app import Settings
from vbm_engine.backends import DOWNLOAD_GB, default_backends

MARGIN_GB = 5.0


def free_gb(path: Path) -> float:
    probe = path
    while not probe.exists():
        probe = probe.parent
    return shutil.disk_usage(probe).free / 1e9


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="vbm_engine.download")
    parser.add_argument("model", choices=sorted(DOWNLOAD_GB))
    args = parser.parse_args(argv)
    cache = Settings.from_env().cache_dir
    need = DOWNLOAD_GB[args.model] + MARGIN_GB
    have = free_gb(cache)
    if have < need:
        print(
            f"Not enough disk: {args.model} needs about {need:.0f} GB free at {cache}, "
            f"{have:.1f} GB available.",
            file=sys.stderr,
        )
        return 3
    backend = default_backends(cache)[args.model]
    download = getattr(backend, "download", None)
    if download is None:
        print(f"{args.model} has no downloader.", file=sys.stderr)
        return 2
    print(f"Downloading {args.model} to {cache} ({have:.1f} GB free)...")
    download()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
