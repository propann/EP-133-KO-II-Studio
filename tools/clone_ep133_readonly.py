#!/usr/bin/env python3
"""Clone intégral EP-133 en lecture seule : projets, samples et manifeste.

Le dossier cible doit être explicite. Aucun appel d'écriture vers la machine
n'est utilisé. Les fichiers déjà copiés et de taille identique sont repris.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
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
    for directory in (projects_dir, samples_dir, metadata_dir):
        directory.mkdir(parents=True, exist_ok=True)

    project_match = re.fullmatch(r"(\d+)-(\d+)", args.projects)
    if not project_match:
        raise SystemExit("--projects doit utiliser la forme 1-9")
    first_project, last_project = map(int, project_match.groups())
    if first_project < 1 or last_project > 9 or first_project > last_project:
        raise SystemExit("La plage de projets EP-133 doit rester entre 1 et 9.")

    client = FileClient(product_byte=EP133_PRODUCT, port_hint=args.port,
                        lock_owner="rhythm_hero_full_clone_readonly")
    created_at = datetime.now(timezone.utc).isoformat()
    manifest = {
        "schema": "ep133.rhythm-hero.clone.v1",
        "readOnly": True,
        "machine": {"name": args.name, "capacityMb": args.capacity_mb},
        "createdAt": created_at,
        "status": "running",
        "projects": [], "sounds": [], "errors": [],
    }
    manifest_path = target / "manifest.json"
    atomic_json(manifest_path, manifest)

    for number in range(first_project, last_project + 1):
        try:
            data, meta = client.read_project_archive(number)
            path = projects_dir / f"P{number:02d}.tar"
            path.write_bytes(data)
            manifest["projects"].append({"project": number, "file": str(path.relative_to(target)),
                                         "bytes": len(data), "sha256": sha256(path),
                                         "deviceName": meta.get("name")})
            print(f"projet {number}/9 : {len(data)} octets")
        except Exception as error:  # garder les autres projets récupérables
            manifest["errors"].append({"kind": "project", "id": number, "error": str(error)})
        atomic_json(manifest_path, manifest)

    nodes = sorted(client.list_sounds(), key=lambda node: int(node["id"]))
    for index, node in enumerate(nodes, 1):
        slot = int(node["id"])
        expected_size = int(node["size"])
        path = samples_dir / f"{slot:03d}.pcm"
        try:
            if not path.exists() or path.stat().st_size != expected_size:
                data, metadata = client.read_sound(slot)
                path.write_bytes(data)
            else:
                metadata = client.get_sample_metadata(slot)
            metadata_path = metadata_dir / f"{slot:03d}.json"
            atomic_json(metadata_path, metadata)
            manifest["sounds"].append({"slot": slot, "file": str(path.relative_to(target)),
                                       "metadata": str(metadata_path.relative_to(target)),
                                       "bytes": path.stat().st_size, "sha256": sha256(path)})
            print(f"son {index}/{len(nodes)} · slot {slot:03d}")
        except Exception as error:
            manifest["errors"].append({"kind": "sound", "id": slot, "error": str(error)})
        atomic_json(manifest_path, manifest)

    manifest["finishedAt"] = datetime.now(timezone.utc).isoformat()
    manifest["status"] = "complete" if not manifest["errors"] else "partial"
    manifest["summary"] = {
        "projectCount": len(manifest["projects"]),
        "soundCount": len(manifest["sounds"]),
        "soundBytes": sum(sound["bytes"] for sound in manifest["sounds"]),
        "errorCount": len(manifest["errors"]),
    }
    atomic_json(manifest_path, manifest)
    print(f"clone {manifest['status']} -> {target}")
    return 0 if manifest["status"] == "complete" else 2


if __name__ == "__main__":
    raise SystemExit(main())
