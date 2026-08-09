#!/usr/bin/env python3
"""Inventorie tous les slots sonores EP-133 sans télécharger ni écrire l'audio."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from epsysex.fileclient import FileClient
from epsysex.sysex import EP133_PRODUCT


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", default="EP-133")
    parser.add_argument("--out", type=Path, default=Path("public/ep133-sound-index.json"))
    args = parser.parse_args()
    client = FileClient(product_byte=EP133_PRODUCT, port_hint=args.port,
                        lock_owner="rhythm_hero_sound_inventory_readonly")
    nodes = sorted(client.list_sounds(), key=lambda node: int(node["id"]))
    sounds = [{"slot": int(node["id"]), "bytes": int(node["size"]),
               "flags": int(node["flags"]), "fileName": node["name"]}
              for node in nodes]
    result = {
        "schema": "ep133.rhythm-hero.sound-index.v1",
        "readOnly": True,
        "scannedAt": datetime.now(timezone.utc).isoformat(),
        "soundCount": len(sounds),
        "usedBytes": sum(sound["bytes"] for sound in sounds),
        "sounds": sounds,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(f"Inventaire global lecture seule : {len(sounds)} sons, {result['usedBytes']/1e6:.2f} Mo -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
