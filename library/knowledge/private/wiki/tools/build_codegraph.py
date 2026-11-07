"""Deterministic code graph for VocalBlackMagic: modules, routes, endpoints and their edges."""

from __future__ import annotations

import ast
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[5]
OUT = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else Path(__file__).resolve().parents[1]
SRC_GLOBS = [
    "apps/*.py",
    "apps/**/*.py",
    "apps/**/*.ts",
    "apps/**/*.svelte",
    "packages/**/*.ts",
    "packages/**/*.svelte",
    "packages/**/*.css",
    "tests/*.py",
    "apps/*/index.html",
    "services/**/*.py",
]
IMPORT_RE = re.compile(r"""^\s*import\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]""", re.M)
_TOKEN = r"""(?:'[^']*'|"[^"]*"|`[^`]*`|[\w.]+(?:\([^()]*\))?)"""
# fetch(...) or the app's api(...) helper with a literal, template or `+` chain starting at /api/.
FETCH_RE = re.compile(r"\b(?:fetch|api)(?:<[^()]*?>)?\(\s*(?=['\"`]/api/)(" + _TOKEN + r"(?:\s*\+\s*" + _TOKEN + r")*)")
ENGINE_RE = re.compile(r"\bat\(\s*deps,\s*(" + _TOKEN + r"(?:\s*\+\s*" + _TOKEN + r")*)\)")
PART_RE = re.compile(r"""'([^']*)'|"([^"]*)"|`([^`]*)`|(\S+)""")
UPSTREAM_RE = re.compile(
    r"""upstreamUrl\(\s*(?:'([A-Z_]+)',\s*'[^']*',\s*)?['"`](/api/[^'"`$]*)(\$\{|['"`]\s*\+)?""",
    re.S,
)
PY_ROUTE_RE = re.compile(r"""@app\.(get|post|delete|put|patch)\("([^"]+)\"""")
HTTP_METHOD_RE = re.compile(r"export const (GET|POST|DELETE|PUT|PATCH)\b")
PKG_ALIAS = {
    "@vbm/contracts": "packages/contracts/src/index.ts",
    "@vbm/auth": "packages/auth/src/index.ts",
    "@vbm/billing": "packages/billing/src/index.ts",
    "@vbm/database": "packages/database/src/index.ts",
}

files = sorted(
    set(
        subprocess.run(
            ["git", "-C", str(REPO), "ls-files", "-z", *SRC_GLOBS],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.split("\0")
    )
)
files = [f for f in files if f and not f.endswith(".d.ts")]
nodes: dict[str, dict[str, object]] = {}
edges: set[tuple[str, str, str]] = set()


def add(node_id: str, **attrs: object) -> None:
    nodes.setdefault(node_id, {"id": node_id, **attrs})


def app_of(path: str) -> str:
    parts = path.split("/")
    return "/".join(parts[:2]) if parts[0] in {"apps", "packages", "services"} else parts[0]


def call_path(chain: str) -> str:
    """Join a string-concatenation chain into a path, with each dynamic part as `*`."""
    out = ""
    for piece in re.split(r"\s*\+\s*", chain):
        m = PART_RE.fullmatch(piece.strip())
        literal = next((g for g in m.groups()[:3] if g is not None), None) if m else None
        out += re.sub(r"\$\{[^}]*\}", "*", literal) if literal is not None else "*"
    return re.sub(r"\*+", "*", out.split("?", 1)[0]).rstrip("/") or "/"


def call_method(text: str, end: int) -> str:
    opts = re.search(r"method:\s*'([A-Z]+)'", text[end : end + 200].split(")", 1)[0])
    return opts.group(1) if opts else "GET"


def py_module_file(f: str, module: str, level: int) -> list[str]:
    """Candidate repo files for a Python import, rooted at the repo, its service, or the file's package."""
    parts = f.split("/")
    if level:
        roots = ["/".join(parts[: len(parts) - level])]
    else:
        roots = [""] + (["/".join(parts[:2])] if parts[0] == "services" else [])
    rel = module.replace(".", "/") if module else ""
    out = []
    for root in roots:
        stem = "/".join(x for x in (root, rel) if x)
        out += [stem + ".py", stem + "/__init__.py"]
    return out


def sveltekit_route(path: str) -> str | None:
    m = re.match(r"apps/[^/]+/src/routes(.*)/\+(server\.ts|page\.svelte)$", path)
    return (m.group(1) or "/") if m else None


for f in files:
    text = (REPO / f).read_text(encoding="utf-8")
    kind = (
        "test"
        if f.startswith("tests/") or "/tests/" in f or f.endswith(".test.ts")
        else "svelte-component"
        if f.endswith(".svelte")
        else "static-page"
        if f.endswith(".html")
        else "stylesheet"
        if f.endswith(".css")
        else "module"
    )
    add(f, type="file", kind=kind, app=app_of(f), lines=text.count("\n") + 1)
    if kind == "stylesheet":
        continue
    route = sveltekit_route(f)
    if route is not None:
        methods = HTTP_METHOD_RE.findall(text) if f.endswith("+server.ts") else ["PAGE"]
        for method in sorted(methods):
            rid = f"route:{app_of(f)}:{method} {route}"
            add(rid, type="sveltekit-route", app=app_of(f), method=method, path=route)
            edges.add((rid, f, "defined_in"))
    if f.endswith(".py"):
        tree = ast.parse(text)
        # Walk the whole tree: backends import their model libraries lazily inside functions.
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                wanted = [(a.name, 0) for a in node.names]
            elif isinstance(node, ast.ImportFrom):
                base = node.module or ""
                # `from pkg import sub` may name a submodule; prefer it when that file exists.
                wanted = [(".".join(x for x in (base, a.name) if x), node.level) for a in node.names]
                wanted.append((base, node.level))
            else:
                continue
            for mod, level in wanted:
                hit = next((c for c in py_module_file(f, mod, level) if c in files and c != f), None)
                if hit:
                    edges.add((f, hit, "imports"))
                    if isinstance(node, ast.ImportFrom):
                        break
        for method, path in PY_ROUTE_RE.findall(text):
            eid = f"endpoint:{app_of(f)}:{method.upper()} {path}"
            add(eid, type="python-endpoint", app=app_of(f), method=method.upper(), path=path)
            edges.add((eid, f, "defined_in"))
        continue
    for spec in IMPORT_RE.findall(text):
        if spec in PKG_ALIAS:
            edges.add((f, PKG_ALIAS[spec], "imports"))
        elif spec.startswith("@vbm/ui/"):
            target = "packages/ui/src/" + spec.split("/")[-1]
            target = next((c for c in (target, target + ".ts") if c in files), target)
            edges.add((f, target, "imports"))
        elif spec.startswith("."):
            target = (Path(f).parent / spec).as_posix()
            target = str(Path(target)).replace("\\", "/")
            parts: list[str] = []
            for p in target.split("/"):
                if p == "..":
                    # An import that climbs above the repo root resolves to nothing.
                    if parts:
                        parts.pop()
                elif p != ".":
                    parts.append(p)
            target = "/".join(parts)
            for cand in (target, target + ".ts", target + "/index.ts"):
                if cand in files:
                    edges.add((f, cand, "imports"))
                    break
        else:
            add(f"pkg:{spec}", type="external-package")
            edges.add((f, f"pkg:{spec}", "imports"))
    for m in FETCH_RE.finditer(text):
        rel = "static_page_fetch" if f.endswith(".html") else "browser_fetch"
        method = call_method(text, m.end())
        edges.add((f, f"api-path:{app_of(f)}:{method}:{call_path(m.group(1))}", rel))
    for m in ENGINE_RE.finditer(text):
        method = call_method(text, m.end())
        edges.add((f, f"api-path:services/audio-engine:{method}:{call_path(m.group(1))}", "engine_call"))
    if not f.endswith((".test.ts", ".html")):
        for host in sorted(set(re.findall(r"https://([a-z0-9.-]+\.[a-z]{2,})", text))):
            add(f"external:{host}", type="external-service")
            edges.add((f, f"external:{host}", "calls_external"))
    handlers = [(h.start(), h.group(1)) for h in HTTP_METHOD_RE.finditer(text)]
    for m in UPSTREAM_RE.finditer(text):
        env_key, path, dyn = m.groups()
        path = path.rstrip("/") + ("/*" if dyn else "")
        method = next((meth for pos, meth in reversed(handlers) if pos < m.start()), "GET")
        backend = (
            "apps/vocal_fix"
            if (env_key == "VOCAL_FIX_API_URL" or "vocal-fix" in f)
            else "apps/ttb_studio"
        )
        edges.add((f, f"api-path:{backend}:{method}:{path}", "proxies_to"))

# Resolve api-path placeholders onto routes/endpoints by path prefix.
resolved: set[tuple[str, str, str]] = set()
for src, dst, rel in sorted(edges):
    if not dst.startswith("api-path:"):
        resolved.add((src, dst, rel))
        continue
    _, scope, method, path = dst.split(":", 3)
    want = "sveltekit-route" if rel == "browser_fetch" else "python-endpoint"
    hits = sorted(
        n
        for n, a in nodes.items()
        if a.get("type") == want
        and a.get("app") == scope
        and a.get("method") == method
        and re.sub(r"\[[^]]+\]|\{[^}]+\}", "*", str(a["path"])).rstrip("/") == path.rstrip("/")
    )
    for h in hits or [dst]:
        if not hits:
            add(dst, type="unresolved-api-path")
        resolved.add((src, h, rel))

links = [{"source": s, "target": t, "relation": r} for s, t, r in sorted(resolved)]
graph = {
    "directed": True,
    "multigraph": False,
    "graph": {"repo": "VocalBlackMagic", "generator": "build_codegraph.py"},
    "nodes": [nodes[k] for k in sorted(nodes)],
    "links": links,
}
blob = json.dumps(graph, indent=2, sort_keys=True) + "\n"
graph_sha = hashlib.sha256(blob.encode()).hexdigest()
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "codegraph.json").write_text(blob, encoding="utf-8")


def mid(node_id: str) -> str:
    return "n" + hashlib.sha256(node_id.encode()).hexdigest()[:10]


def label(node_id: str) -> str:
    return (
        node_id.replace("route:", "")
        .replace("endpoint:", "")
        .replace("external:", "")
        .replace('"', "'")
    )


internal = [e for e in links if not e["target"].startswith("pkg:")]
used = sorted({e["source"] for e in internal} | {e["target"] for e in internal})
groups: dict[str, list[str]] = {}
for n in used:
    a = nodes[n]
    groups.setdefault(str(a.get("app") or a.get("type")), []).append(n)
lines = ["flowchart LR"]
for group in sorted(groups):
    lines.append(f'  subgraph {mid(group)}["{group}"]')
    lines.extend(f'    {mid(n)}["{label(n)}"]' for n in groups[group])
    lines.append("  end")
arrow = {
    "imports": "-->",
    "defined_in": "-.->",
    "browser_fetch": "==>",
    "proxies_to": "==>",
    "static_page_fetch": "==>",
    "calls_external": "==>",
    "engine_call": "==>",
}
for e in internal:
    rel = e["relation"]
    lines.append(f"  {mid(e['source'])} {arrow.get(rel, '-->')}|{rel}| {mid(e['target'])}")
(OUT / "codegraph.mmd").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(json.dumps({"nodes": len(nodes), "links": len(resolved), "sha256": graph_sha}))
