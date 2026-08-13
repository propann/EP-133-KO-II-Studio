#!/usr/bin/env python3
"""Pont HTTP local minimal entre le Studio web et le cloneur EP-133.

Écoute uniquement sur 127.0.0.1. Le dossier racine est fixé au démarrage et
ne peut pas être modifié par une requête web.
"""
from __future__ import annotations

import argparse
import base64
import json
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

# Routes /projects/* (liste, lecture, écriture) — glisser-déposer de
# projets côté Sons & Transfert. Réutilise le code déjà écrit et validé en
# conditions réelles (checkpoint, compile_project, écriture, relecture
# octet à octet) plutôt que de le dupliquer — voir
# tools/send_project_to_machine.py, testé à la main : copie P01->P09
# confirmée par l'utilisateur sur la machine.
sys.path.insert(0, str(Path(__file__).resolve().parent))
# Même hypothèse d'environnement que le reste du pont (venv epsysex déjà
# requis pour /clone/*) — pas de repli silencieux si absent, une erreur
# claire au démarrage vaut mieux qu'une route /projects/* qui échoue plus
# tard sans explication.
from send_project_to_machine import checkpoint_project, write_project_verified  # noqa: E402
from epsysex import FileClient, compile_project  # noqa: E402
from epsysex.fileclient import project_fid  # noqa: E402


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
                    full_manifest = json.loads(path.read_text())
                    manifest = {key: full_manifest.get(key) for key in
                                ("status", "syncMode", "createdAt", "finishedAt",
                                 "progress", "summary", "changes")}
                except (OSError, json.JSONDecodeError) as error:
                    self.last_error = str(error)
            return {"bridge": True, "running": running, "exitCode": exit_code,
                    "root": str(self.root), "machineName": self.machine_name,
                    "manifest": manifest, "error": self.last_error}


# Emplacements de projet réellement affichés ailleurs dans l'app (voir
# EditorToolbar.tsx, dialogue « PROJETS MACHINE », grille de 9 cases) —
# même convention reprise ici plutôt que le maximum théorique du protocole (99).
MAX_PROJECT_SLOT = 9


def list_projects() -> list[dict]:
    client = FileClient()
    results = []
    for slot in range(1, MAX_PROJECT_SLOT + 1):
        try:
            info = client.stat(project_fid(slot))
            results.append({"slot": slot, "present": True, "byteSize": info.get("byteSize"), "flags": info.get("flags"), "name": info.get("name")})
        except Exception as error:  # noqa: BLE001 — un slot en erreur ne doit pas bloquer les autres
            results.append({"slot": slot, "present": False, "error": str(error)})
    return results


def read_project(slot: int) -> dict:
    client = FileClient()
    tar_bytes, meta = client.read_project_archive(slot)
    return {"slot": slot, "meta": meta, "tarBase64": base64.b64encode(tar_bytes).decode("ascii")}


def write_project(root: Path, slot: int, document: dict) -> dict:
    """Même séquence que `send_project_to_machine.py write` (checkpoint,
    compile_project avec base réelle, écriture, relecture octet à octet,
    activation) — testée à la main cette session, exposée ici en HTTP."""
    checkpoints_dir = root / "checkpoints"
    client = FileClient()
    current_bytes, checkpoint_path = checkpoint_project(client, slot, checkpoints_dir, tag="bridge")
    compiled = compile_project(document, base_archive=current_bytes)
    write_project_verified(client, slot, compiled)  # lève RuntimeError si la relecture diverge
    reload_result = client.reload_project(slot)
    return {"slot": slot, "checkpoint": str(checkpoint_path), "bytesWritten": len(compiled), "reload": reload_result}


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
            parsed = urlparse(self.path)
            path = parsed.path
            if path == "/health":
                self.send_json(200, {"bridge": True, "root": str(state.root)})
            elif path == "/clone/status":
                self.send_json(200, state.status())
            elif path == "/projects/list":
                try:
                    self.send_json(200, {"projects": list_projects()})
                except Exception as error:  # noqa: BLE001 — jamais planter le serveur sur une erreur MIDI
                    self.send_json(502, {"error": str(error)})
            elif path == "/projects/read":
                try:
                    slot = int(parse_qs(parsed.query).get("slot", ["0"])[0])
                    if not (1 <= slot <= MAX_PROJECT_SLOT): raise ValueError("slot invalide")
                    self.send_json(200, read_project(slot))
                except (ValueError, KeyError) as error:
                    self.send_json(400, {"error": str(error)})
                except Exception as error:  # noqa: BLE001
                    self.send_json(502, {"error": str(error)})
            else:
                self.send_json(404, {"error": "not-found"})

        def do_POST(self):
            path = urlparse(self.path).path
            if path == "/clone/start":
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
            elif path == "/projects/write":
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                    value = json.loads(self.rfile.read(length) or b"{}")
                    slot = int(value.get("slot", 0))
                    if not (1 <= slot <= MAX_PROJECT_SLOT): raise ValueError("slot invalide")
                    document = value.get("document")
                    if not isinstance(document, dict): raise ValueError("document manquant ou invalide")
                    result = write_project(state.root, slot, document)
                    self.send_json(200, result)
                except (ValueError, json.JSONDecodeError) as error:
                    self.send_json(400, {"error": str(error)})
                except Exception as error:  # noqa: BLE001 — checkpoint déjà écrit avant toute écriture réelle, voir write_project
                    self.send_json(502, {"error": str(error)})
            else:
                self.send_json(404, {"error": "not-found"})

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
