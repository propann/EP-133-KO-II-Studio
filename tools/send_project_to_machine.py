#!/usr/bin/env python3
"""Écrit un projet Studio sur un slot réel de l'EP-133 — Phase 5 de ROADMAP.md.

Première tentative d'écriture jamais faite dans ce dépôt. Tout le reste du
projet est en lecture seule par principe ; ce script existe justement pour
sortir ce chemin du bac à sable, étape par étape, avec un checkpoint et une
relecture de vérification à chaque écriture — jamais une action en un clic
depuis l'app web tant que ce chemin n'a pas été exercé en vrai.

S'appuie sur `epsysex` (kmorrill/ep-series-sysex, MIT), déjà installé dans
le venv du pont de clonage (voir docs/PONT_LOCAL_CLONAGE.md) :
- compile_project(doc, base_archive=...) : JSON -> TAR de projet, en
  préservant tout ce qui n'est pas explicitement décrit quand une base est
  fournie.
- FileClient.read_project_archive/write_project_archive/reload_project :
  lecture/écriture/activation avec relecture de vérification intégrée.
- Verrou inter-processus + préflight anti-boucle-de-debug intégrés à la
  bibliothèque (voir epsysex.devicelock).

ATTENTION : l'onglet navigateur connecté à la machine (Test Machine, Sons &
Transfert, Studio...) NE DOIT PAS émettre de trafic MIDI/SysEx pendant que
ce script tourne — deux sessions FILE simultanées, même deux lectures,
peuvent faire entrer le firmware dans une boucle de debug qui nécessite un
cycle d'alimentation (documenté dans epsysex.devicelock lui-même).

Usage :
    python3 tools/send_project_to_machine.py checkpoint --slot 9
    python3 tools/send_project_to_machine.py write --slot 9 --confirm
    python3 tools/send_project_to_machine.py restore --slot 9 --from <chemin.tar>
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from epsysex import FileClient, compile_project, identity_from_device
    from epsysex.tar import iter_members
except ImportError:
    print(
        "epsysex introuvable — active le venv du pont de clonage :\n"
        "  /tmp/ep133-scan-venv/bin/python tools/send_project_to_machine.py ...",
        file=sys.stderr,
    )
    raise

DEFAULT_ROOT = Path("/home/azoth/Musique/OP-133")


def now_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def describe_archive(tar_bytes: bytes) -> dict[str, int]:
    """Nom -> taille pour chaque membre fichier (ignore les entrées répertoire, typeflag '5')."""
    members = {}
    for name, start, size, typeflag in iter_members(tar_bytes):
        if typeflag != "5":
            members[name] = size
    return members


def minimal_test_document(slot: int) -> dict:
    """Document ep.project.v1 délibérément minimal : un seul pad, un seul
    événement dans le pattern A01 — pas un vrai projet Studio à ce stade
    (voir le plan : un vrai projet n'est tenté qu'après un premier
    aller-retour réussi sur ce document-ci)."""
    return {
        "schema": "ep.project.v1",
        "product": "ep133",
        "pads": [
            {"group": "A", "pad": 1},
        ],
        "patterns": [
            {
                "id": "A01",
                "bars": 1,
                "events": [
                    {"tick": 0, "pad": 1, "note": 60, "velocity": 100, "duration": 480},
                ],
            },
        ],
    }


def cmd_checkpoint(args: argparse.Namespace) -> None:
    root = Path(args.root)
    checkpoints_dir = root / "checkpoints"
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    print(f"1) Identité machine (Identity Request, ne touche pas au sous-système FILE)…")
    identity = identity_from_device()
    print(f"   -> {identity}")

    client = FileClient()
    print(f"2) Lecture du slot P{args.slot:02d} (read_project_archive)…")
    tar_bytes, meta = client.read_project_archive(args.slot)
    print(f"   -> {len(tar_bytes)} octets, meta={meta}")

    checkpoint_path = checkpoints_dir / f"P{args.slot:02d}-avant-{now_stamp()}.tar"
    checkpoint_path.write_bytes(tar_bytes)
    print(f"3) Checkpoint écrit : {checkpoint_path}")

    print("4) Compilation hors ligne d'un document de test minimal (base = checkpoint)…")
    doc = minimal_test_document(args.slot)
    compiled = compile_project(doc, base_archive=tar_bytes)
    print(f"   -> {len(compiled)} octets compilés")

    before = describe_archive(tar_bytes)
    after = describe_archive(compiled)
    changed = sorted(name for name in after if before.get(name) != after[name])
    removed = sorted(name for name in before if name not in after)
    print("5) Comparaison hors ligne (aucun trafic vers la machine à cette étape) :")
    print(f"   Membres modifiés/ajoutés : {changed or '(aucun)'}")
    print(f"   Membres supprimés        : {removed or '(aucun)'}")
    print(f"   Total avant : {len(before)} membres, {sum(before.values())} octets")
    print(f"   Total après : {len(after)} membres, {sum(after.values())} octets")
    print()
    print("Étape A terminée. Aucune écriture n'a été envoyée à la machine.")
    print(f"Checkpoint de restauration : {checkpoint_path}")
    print(
        f"Pour écrire réellement (après relecture de ce rapport) :\n"
        f"  python3 tools/send_project_to_machine.py write --slot {args.slot} --confirm"
    )


def cmd_write(args: argparse.Namespace) -> None:
    if not args.confirm:
        print("Refus : ajoute --confirm pour écrire réellement sur la machine.", file=sys.stderr)
        sys.exit(1)

    root = Path(args.root)
    checkpoints_dir = root / "checkpoints"
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    client = FileClient()
    print(f"1) Lecture de l'état actuel du slot P{args.slot:02d} (nouveau checkpoint avant écriture)…")
    current_bytes, _meta = client.read_project_archive(args.slot)
    checkpoint_path = checkpoints_dir / f"P{args.slot:02d}-avant-{now_stamp()}.tar"
    checkpoint_path.write_bytes(current_bytes)
    print(f"   -> Checkpoint : {checkpoint_path}")

    print("2) Compilation du document de test (base = état actuel du slot)…")
    doc = minimal_test_document(args.slot)
    compiled = compile_project(doc, base_archive=current_bytes)
    print(f"   -> {len(compiled)} octets")

    print(f"3) Écriture du slot P{args.slot:02d} (write_project_archive)…")
    client.write_project_archive(args.slot, compiled)
    print("   -> Écrit.")

    print("4) Relecture immédiate pour vérification octet à octet (avant toute activation)…")
    written_bytes, _meta = client.read_project_archive(args.slot)
    if written_bytes != compiled:
        print(
            "   -> ÉCHEC : la relecture ne correspond PAS à ce qui a été écrit.\n"
            f"   Restaure immédiatement avec :\n"
            f"   python3 tools/send_project_to_machine.py restore --slot {args.slot} --from {checkpoint_path}",
            file=sys.stderr,
        )
        sys.exit(1)
    print("   -> Identique octet à octet. L'écriture a bien atterri.")

    print(f"5) Activation (reload_project) — relectures de vérification intégrées à epsysex…")
    result = client.reload_project(args.slot)
    print(f"   -> {result}")
    print()
    print(f"Succès. Checkpoint de restauration conservé : {checkpoint_path}")


def cmd_restore(args: argparse.Namespace) -> None:
    checkpoint_path = Path(args.checkpoint)
    if not checkpoint_path.is_file():
        print(f"Checkpoint introuvable : {checkpoint_path}", file=sys.stderr)
        sys.exit(1)
    tar_bytes = checkpoint_path.read_bytes()

    client = FileClient()
    print(f"Restauration du slot P{args.slot:02d} depuis {checkpoint_path} ({len(tar_bytes)} octets)…")
    client.write_project_archive(args.slot, tar_bytes)
    written_bytes, _meta = client.read_project_archive(args.slot)
    if written_bytes != tar_bytes:
        print("ÉCHEC : la relecture après restauration ne correspond pas au checkpoint.", file=sys.stderr)
        sys.exit(1)
    print("Écriture vérifiée octet à octet. Activation (reload_project)…")
    result = client.reload_project(args.slot)
    print(f"-> {result}")
    print("Restauration terminée.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--root", default=str(DEFAULT_ROOT), help="Dossier de travail (checkpoints/ y est créé)")
    sub = parser.add_subparsers(dest="command", required=True)

    checkpoint = sub.add_parser("checkpoint", help="Lecture seule : checkpoint + répétition de compilation hors ligne")
    checkpoint.add_argument("--slot", type=int, required=True, help="Numéro de projet (1-99)")
    checkpoint.set_defaults(func=cmd_checkpoint)

    write = sub.add_parser("write", help="Écriture réelle sur la machine (nécessite --confirm)")
    write.add_argument("--slot", type=int, required=True)
    write.add_argument("--confirm", action="store_true", help="Confirme explicitement l'écriture réelle")
    write.set_defaults(func=cmd_write)

    restore = sub.add_parser("restore", help="Restaure un checkpoint précédemment écrit")
    restore.add_argument("--slot", type=int, required=True)
    restore.add_argument("--from", dest="checkpoint", required=True, help="Chemin du fichier .tar de checkpoint")
    restore.set_defaults(func=cmd_restore)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
