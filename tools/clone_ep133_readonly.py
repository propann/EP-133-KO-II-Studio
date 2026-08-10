#!/usr/bin/env python3
"""Clone incrémental EP-133 en lecture seule : projets, samples et manifeste.

Le dossier cible doit être explicite. Aucun appel d'écriture vers la machine
n'est utilisé. Un clone existant est comparé et seuls les changements sont écrits.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path

from epsysex.fileclient import FileClient
from epsysex.sysex import EP133_PRODUCT


def safe_name(value: str) -> str:
    clean = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip()).strip("-.")
    return clean or "mon-ep133"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def atomic_json(path: Path, value: object) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(path)


def atomic_bytes(path: Path, value: bytes) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(value)
    temporary.replace(path)


def load_json(path: Path) -> dict | None:
    try:
        value = json.loads(path.read_text())
        return value if isinstance(value, dict) else None
    except (OSError, json.JSONDecodeError):
        return None


def bytes_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, required=True,
                        help="dossier parent choisi par l'utilisateur")
    parser.add_argument("--name", default="MON EP-133")
    parser.add_argument("--capacity-mb", type=int, choices=(64, 128), required=True)
    parser.add_argument("--port", default="EP-133")
    parser.add_argument("--projects", default="1-9")
    args = parser.parse_args()

    target_parent = args.out.expanduser().resolve()
    if target_parent == Path("/") or target_parent == Path.home():
        raise SystemExit("Refus d'utiliser la racine ou le dossier personnel comme cible directe.")
    # Arborescence canonique : le dossier choisi reste propre et tous les
    # miroirs de machines vivent sous clone/<nom-machine>/.
    target = target_parent / "clone" / safe_name(args.name)
    projects_dir = target / "projects"
    samples_dir = target / "samples"
    metadata_dir = target / "metadata"
    history_dir = target / "history"
    for directory in (projects_dir, samples_dir, metadata_dir, history_dir):
        directory.mkdir(parents=True, exist_ok=True)

    project_match = re.fullmatch(r"(\d+)-(\d+)", args.projects)
    if not project_match:
        raise SystemExit("--projects doit utiliser la forme 1-9")
    first_project, last_project = map(int, project_match.groups())
    if first_project < 1 or last_project > 9 or first_project > last_project:
        raise SystemExit("La plage de projets EP-133 doit rester entre 1 et 9.")

    manifest_path = target / "manifest.json"
    previous = load_json(manifest_path)
    baseline = previous
    if previous and previous.get("status") in ("complete", "partial"):
        stamp = str(previous.get("finishedAt") or previous.get("createdAt") or "ancien")
        stamp = re.sub(r"[^0-9TZ-]", "-", stamp)[:24]
        atomic_json(history_dir / f"manifest-{stamp}.json", previous)
    elif previous:
        for archived_path in sorted(history_dir.glob("manifest-*.json"), reverse=True):
            archived = load_json(archived_path)
            if archived and archived.get("status") in ("complete", "partial"):
                baseline = archived
                break
    previous_projects = {int(item["project"]): item for item in (baseline or {}).get("projects", [])}
    previous_sounds = {int(item["slot"]): item for item in (baseline or {}).get("sounds", [])}

    client = FileClient(product_byte=EP133_PRODUCT, port_hint=args.port,
                        lock_owner="rhythm_hero_incremental_clone_readonly")
    created_at = datetime.now(timezone.utc).isoformat()
    started_monotonic = time.monotonic()
    manifest = {
        "schema": "ep133.rhythm-hero.clone.v2",
        "readOnly": True,
        "syncMode": "incremental" if baseline else "initial",
        "machine": {"name": args.name, "capacityMb": args.capacity_mb},
        "createdAt": created_at,
        "status": "running",
        "progress": {"phase": "projects", "current": 0, "total": last_project - first_project + 1,
                     "elapsedSeconds": 0, "estimatedRemainingSeconds": None},
        "projects": [], "sounds": [], "errors": [],
        "changes": {"projectsUpdated": 0, "projectsUnchanged": 0,
                    "soundsAdded": 0, "soundsUpdated": 0,
                    "soundsUnchanged": 0, "soundsDeleted": 0,
                    "bytesDownloaded": 0},
    }
    atomic_json(manifest_path, manifest)

    for number in range(first_project, last_project + 1):
        try:
            data, meta = client.read_project_archive(number)
            path = projects_dir / f"P{number:02d}.tar"
            digest = bytes_sha256(data)
            old = previous_projects.get(number)
            unchanged = bool(old and old.get("sha256") == digest and path.exists()
                             and sha256(path) == digest)
            if unchanged:
                manifest["changes"]["projectsUnchanged"] += 1
            else:
                atomic_bytes(path, data)
                manifest["changes"]["projectsUpdated"] += 1
            manifest["projects"].append({"project": number, "file": str(path.relative_to(target)),
                                         "bytes": len(data), "sha256": digest,
                                         "deviceName": meta.get("name")})
            print(f"projet {number}/9 : {'inchangé' if unchanged else 'mis à jour'}", flush=True)
        except Exception as error:  # garder les autres projets récupérables
            manifest["errors"].append({"kind": "project", "id": number, "error": str(error)})
        elapsed = time.monotonic() - started_monotonic
        completed = number - first_project + 1
        manifest["progress"] = {"phase": "projects", "current": completed,
                                "total": last_project - first_project + 1,
                                "elapsedSeconds": round(elapsed, 1),
                                "estimatedRemainingSeconds": round(elapsed / completed * (last_project - number), 1)}
        atomic_json(manifest_path, manifest)

    try:
        nodes = sorted(client.list_sounds(), key=lambda node: int(node["id"]))
    except Exception as error:
        nodes = []
        manifest["errors"].append({"kind": "sound-list", "error": str(error)})
    current_slots = {int(node["id"]) for node in nodes}
    manifest["changes"]["soundsDeleted"] = len(set(previous_sounds) - current_slots)
    sounds_started = time.monotonic()
    for index, node in enumerate(nodes, 1):
        slot = int(node["id"])
        expected_size = int(node["size"])
        path = samples_dir / f"{slot:03d}.pcm"
        metadata_path = metadata_dir / f"{slot:03d}.json"
        try:
            old = previous_sounds.get(slot)
            audio_unchanged = bool(old and path.exists()
                                   and path.stat().st_size == expected_size
                                   and old.get("bytes") == expected_size
                                   and old.get("sha256") == sha256(path))
            if not audio_unchanged:
                data, metadata = client.read_sound(slot)
                atomic_bytes(path, data)
                manifest["changes"]["bytesDownloaded"] += len(data)
            else:
                metadata = client.get_sample_metadata(slot)
            metadata_unchanged = load_json(metadata_path) == metadata
            if not metadata_unchanged:
                atomic_json(metadata_path, metadata)
            unchanged = audio_unchanged and metadata_unchanged
            if unchanged:
                manifest["changes"]["soundsUnchanged"] += 1
            else:
                change_key = "soundsUpdated" if old else "soundsAdded"
                manifest["changes"][change_key] += 1
            manifest["sounds"].append({"slot": slot, "file": str(path.relative_to(target)),
                                       "metadata": str(metadata_path.relative_to(target)),
                                       "bytes": path.stat().st_size, "sha256": sha256(path),
                                       "deviceNode": {"size": expected_size, "name": node.get("name"),
                                                      "flags": node.get("flags")}})
            print(f"son {index}/{len(nodes)} · slot {slot:03d} · {'inchangé' if unchanged else 'copié'}", flush=True)
        except Exception as error:
            manifest["errors"].append({"kind": "sound", "id": slot, "error": str(error)})
        phase_elapsed = time.monotonic() - sounds_started
        manifest["progress"] = {"phase": "samples", "current": index,
                                "total": len(nodes),
                                "elapsedSeconds": round(time.monotonic() - started_monotonic, 1),
                                "estimatedRemainingSeconds": round(phase_elapsed / index * (len(nodes) - index), 1)}
        atomic_json(manifest_path, manifest)

    manifest["finishedAt"] = datetime.now(timezone.utc).isoformat()
    manifest["status"] = "complete" if not manifest["errors"] else "partial"
    manifest["progress"] = {"phase": "complete", "current": len(nodes), "total": len(nodes),
                            "elapsedSeconds": round(time.monotonic() - started_monotonic, 1),
                            "estimatedRemainingSeconds": 0}
    manifest["summary"] = {
        "projectCount": len(manifest["projects"]),
        "soundCount": len(manifest["sounds"]),
        "soundBytes": sum(sound["bytes"] for sound in manifest["sounds"]),
        "errorCount": len(manifest["errors"]),
        **manifest["changes"],
    }
    atomic_json(manifest_path, manifest)
    print(f"clone {manifest['status']} -> {target}", flush=True)
    return 0 if manifest["status"] == "complete" else 2


if __name__ == "__main__":
    raise SystemExit(main())
