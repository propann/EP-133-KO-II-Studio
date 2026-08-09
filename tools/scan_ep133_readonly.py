#!/usr/bin/env python3
"""Scanne un projet EP-133 en lecture seule et produit un inventaire JSON.

Nécessite le paquet MIT ``epsysex`` de kmorrill/ep-series-sysex.
Cette commande n'appelle aucune méthode d'écriture du protocole FILE.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from epsysex.fileclient import FileClient
from epsysex.sysex import EP133_PRODUCT
from epsysex.tar import member_payloads


def signed(value: int) -> int:
    return value - 256 if value > 127 else value


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", type=int, default=1)
    parser.add_argument("--port", default="EP-133")
    parser.add_argument("--out", type=Path, default=Path("public/ep133-device.json"))
    args = parser.parse_args()

    client = FileClient(product_byte=EP133_PRODUCT, port_hint=args.port,
                        lock_owner="rhythm_hero_readonly_scan")
    archive, project_meta = client.read_project_archive(args.project)
    pads = []
    slots = set()
    for member, payload in sorted(member_payloads(archive).items()):
        if not member.startswith("pads/") or len(payload) < 27:
            continue
        group = member.split("/")[1].upper()
        pad = int(member.rsplit("p", 1)[1])
        slot = int.from_bytes(payload[1:3], "little")
        if slot:
            slots.add(slot)
        pads.append({
            "group": group, "pad": pad, "slot": slot,
            "midiChannel": payload[3], "amplitude": payload[16],
            "pitch": signed(payload[17]), "pan": signed(payload[18]),
            "attack": payload[19], "release": payload[20],
            "timeMode": payload[21], "chokeGroup": payload[22],
            "playMode": payload[23], "rootNote": payload[24],
        })

    sounds = {}
    for slot in sorted(slots):
        metadata = client.get_sample_metadata(slot)
        sounds[str(slot)] = {
            "name": metadata.get("name", f"SON {slot:03d}"),
            "channels": metadata.get("channels"),
            "samplerate": metadata.get("samplerate"),
            "playMode": metadata.get("sound.playmode"),
            "rootNote": metadata.get("sound.rootnote"),
            "bpm": metadata.get("sound.bpm"),
        }

    result = {
        "schema": "ep133.rhythm-hero.device.v1",
        "readOnly": True,
        "scannedAt": datetime.now(timezone.utc).isoformat(),
        "project": args.project,
        "projectName": project_meta.get("name"),
        "pads": pads,
        "sounds": sounds,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(f"Inventaire lecture seule : {len(pads)} pads, {len(sounds)} sons -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
