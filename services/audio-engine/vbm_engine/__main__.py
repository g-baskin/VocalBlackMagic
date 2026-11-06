"""Run the engine: python -m vbm_engine [--host 127.0.0.1] [--port 8090]."""

from __future__ import annotations

import argparse
import ipaddress
import sys
from dataclasses import replace

LOCAL_NAMES = ("localhost",)


def is_local_host(host: str) -> bool:
    if host in LOCAL_NAMES:
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="vbm_engine")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8090)
    args = parser.parse_args(argv)

    from vbm_engine.app import Settings, create_app

    settings = Settings.from_env()
    if not settings.token:
        print(
            "Refusing to start without VBM_ENGINE_TOKEN (required on any address).", file=sys.stderr
        )
        return 2
    settings = replace(settings, local_bind=is_local_host(args.host))
    import uvicorn

    uvicorn.run(create_app(settings), host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
