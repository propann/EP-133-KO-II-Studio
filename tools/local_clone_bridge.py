#!/usr/bin/env python3
"""Pont HTTP local minimal entre le Studio web et le cloneur EP-133.

Écoute uniquement sur 127.0.0.1. Le dossier racine est fixé au démarrage et
ne peut pas être modifié par une requête web.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


class CloneState:
    def __init__(self, root: Path, repository: Path):
        self.root = root.resolve()
        self.repository = repository.resolve()
        self.process: subprocess.Popen[str] | None = None
        self.machine_name = ""
        self.capacity_mb = 64
        self.last_error = ""
        self.lock = threading.Lock()

    @staticmethod
    def safe_name(value: str) -> str:
        import re
        clean = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip()).strip("-.")
        return clean or "mon-ep133"

    def manifest_path(self) -> Path:
        return self.root / "clone" / self.safe_name(self.machine_name) / "manifest.json"

    def start(self, name: str, capacity_mb: int) -> dict:
        with self.lock:
            if self.process and self.process.poll() is None:
                return {"started": False, "reason": "clone-running"}
            self.machine_name = name.strip() or "MON EP-133"
            self.capacity_mb = capacity_mb
            self.last_error = ""
            command = [sys.executable, "tools/clone_ep133_readonly.py",
                       "--out", str(self.root), "--name", self.machine_name,
                       "--capacity-mb", str(capacity_mb)]
            log_path = self.root / "clone" / self.safe_name(self.machine_name) / "clone.log"
            log_path.parent.mkdir(parents=True, exist_ok=True)
            log = log_path.open("a", buffering=1)
            self.process = subprocess.Popen(command, cwd=self.repository, stdout=log,
                                            stderr=subprocess.STDOUT, text=True)
            return {"started": True, "pid": self.process.pid, "log": str(log_path)}

    def status(self) -> dict:
        with self.lock:
            running = bool(self.process and self.process.poll() is None)
            exit_code = None if not self.process else self.process.poll()
            manifest = None
            path = self.manifest_path() if self.machine_name else None
            if path and path.exists():
                try:
                    manifest = json.loads(path.read_text())
                except (OSError, json.JSONDecodeError) as error:
                    self.last_error = str(error)
            return {"bridge": True, "running": running, "exitCode": exit_code,
                    "root": str(self.root), "machineName": self.machine_name,
                    "manifest": manifest, "error": self.last_error}


def handler_factory(state: CloneState):
    class Handler(BaseHTTPRequestHandler):
        def send_json(self, status: int, value: object):
            payload = json.dumps(value, ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(payload)

        def do_GET(self):
            path = urlparse(self.path).path
            if path == "/health":
                self.send_json(200, {"bridge": True, "root": str(state.root)})
            elif path == "/clone/status":
                self.send_json(200, state.status())
            else:
                self.send_json(404, {"error": "not-found"})

        def do_POST(self):
            if urlparse(self.path).path != "/clone/start":
                self.send_json(404, {"error": "not-found"}); return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                value = json.loads(self.rfile.read(length) or b"{}")
                name = str(value.get("name", "MON EP-133"))[:32]
                capacity = int(value.get("capacityMb", 64))
                if capacity not in (64, 128): raise ValueError("capacityMb invalide")
                result = state.start(name, capacity)
                self.send_json(202 if result["started"] else 409, result)
            except (ValueError, json.JSONDecodeError) as error:
                self.send_json(400, {"error": str(error)})

        def log_message(self, format, *args):
            print(f"bridge {self.address_string()} · {format % args}", flush=True)

    return Handler


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if args.root.resolve() in (Path("/"), Path.home()):
        raise SystemExit("La racine du pont doit être un sous-dossier explicite.")
    repository = Path(__file__).resolve().parents[1]
    state = CloneState(args.root, repository)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler_factory(state))
    print(f"Pont clone EP-133 : http://127.0.0.1:{args.port} -> {state.root}", flush=True)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
