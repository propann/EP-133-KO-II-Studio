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
    python3 tools/send_project_to_machine.py write-sound --slot 9 --confirm
    python3 tools/send_project_to_machine.py restore --slot 9 --from <chemin.tar>
"""
from __future__ import annotations

import argparse
import math
import struct
import sys
import wave
from datetime import datetime, timezone
from pathlib import Path

try:
    from epsysex import FileClient, compile_project, identity_from_device
    from epsysex.tar import iter_members
    from epsysex.dependencies import ensure_sound_dependencies
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


def checkpoint_project(client: "FileClient", slot: int, checkpoints_dir: Path, tag: str = "") -> tuple[bytes, Path]:
    """Lit l'état actuel d'un slot et l'écrit tel quel dans checkpoints/
    avant toute écriture — fonction réutilisée par toutes les commandes
    d'écriture de ce script ET par le pont local (tools/local_clone_bridge.py,
    routes /projects/*), pour ne jamais dupliquer cette étape critique."""
    checkpoints_dir.mkdir(parents=True, exist_ok=True)
    current_bytes, _meta = client.read_project_archive(slot)
    suffix = f"-{tag}" if tag else ""
    checkpoint_path = checkpoints_dir / f"P{slot:02d}-avant{suffix}-{now_stamp()}.tar"
    checkpoint_path.write_bytes(current_bytes)
    return current_bytes, checkpoint_path


def write_project_verified(client: "FileClient", slot: int, tar_bytes: bytes) -> None:
    """Écrit un slot puis relit immédiatement pour vérifier octet à octet
    — lève RuntimeError si la relecture diverge, avant toute activation.
    Même fonction réutilisée par le CLI et par le pont local."""
    client.write_project_archive(slot, tar_bytes)
    written_bytes, _meta = client.read_project_archive(slot)
    if written_bytes != tar_bytes:
        raise RuntimeError("relecture différente de ce qui a été écrit — abandon avant toute activation")


def describe_archive(tar_bytes: bytes) -> dict[str, bytes]:
    """Nom -> contenu pour chaque membre fichier.

    La taille seule est insuffisante : un pad peut changer de slot tout en
    conservant exactement le même nombre d'octets. Le préflight doit donc
    comparer les payloads complets, même pour un petit TAR.
    """
    members = {}
    for name, start, size, typeflag in iter_members(tar_bytes):
        if typeflag != "5":
            members[name] = tar_bytes[start:start + size]
    return members


def minimal_test_document(slot: int, base_archive: bytes | None = None) -> dict:
    """Document ep.project.v1 délibérément minimal : un seul pad, un seul
    événement dans le pattern A01 — pas un vrai projet Studio à ce stade
    (voir le plan : un vrai projet n'est tenté qu'après un premier
    aller-retour réussi sur ce document-ci)."""
    # Le compilateur attribue une valeur par défaut si le slot est absent du
    # document. Pour un test basé sur un projet réel, cette valeur implicite
    # pourrait déplacer le son du pad A1 sans changer la taille du membre.
    # Reprendre explicitement le slot du checkpoint rend le diff voulu
    # déterministe et évite toute réaffectation silencieuse.
    pad_slot = 0
    if base_archive is not None:
        for name, start, size, typeflag in iter_members(base_archive):
            if name == "pads/a/p01" and typeflag != "5" and size >= 3:
                pad_slot = int.from_bytes(base_archive[start + 1:start + 3], "little")
                break
    return {
        "schema": "ep.project.v1",
        "product": "ep133",
        "pads": [
            {"group": "A", "pad": 1, "slot": pad_slot},
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


def synthesize_demo_wav(path: Path, seconds: float = 0.3, freq_hz: float = 440.0, rate: int = 44100) -> None:
    """Aucun fichier audio de démo n'est fourni dans ce dépôt (pas de .wav
    versionné) — génère un ton pur bref (fondu en enveloppe pour éviter les
    clics), 16 bits mono, sans dépendance externe. `wav_to_pcm16` (epsysex)
    le rééchantillonnera à 46875 Hz au moment de l'upload."""
    frame_count = int(seconds * rate)
    fade = max(1, int(0.01 * rate))  # 10 ms de fondu entrée/sortie
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        frames = bytearray()
        for index in range(frame_count):
            envelope = min(1.0, index / fade, (frame_count - index) / fade)
            value = int(envelope * 0.6 * 32767 * math.sin(2 * math.pi * freq_hz * index / rate))
            frames += struct.pack("<h", value)
        handle.writeframes(bytes(frames))


def cmd_write_sound(args: argparse.Namespace) -> None:
    if not args.confirm:
        print("Refus : ajoute --confirm pour écrire réellement sur la machine.", file=sys.stderr)
        sys.exit(1)

    root = Path(args.root)
    checkpoints_dir = root / "checkpoints"
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    client = FileClient()

    print("1) Liste des slots son occupés (list_sounds)…")
    occupied = {int(node["id"]) for node in client.list_sounds()}
    print(f"   -> {len(occupied)} slots occupés")
    slot = args.sound_slot
    if slot is None:
        slot = next(candidate for candidate in range(1, 1000) if candidate not in occupied)
    elif slot in occupied:
        print(f"ERREUR : le slot son {slot} est déjà occupé — abandon, aucune écriture.", file=sys.stderr)
        sys.exit(1)
    print(f"   -> Slot son cible : {slot} (confirmé libre à l'instant)")

    print(f"2) Lecture de l'état actuel du projet P{args.slot:02d} (checkpoint avant écriture)…")
    current_bytes, _meta = client.read_project_archive(args.slot)
    checkpoint_path = checkpoints_dir / f"P{args.slot:02d}-avant-son-{now_stamp()}.tar"
    checkpoint_path.write_bytes(current_bytes)
    print(f"   -> Checkpoint : {checkpoint_path}")

    if args.wav:
        wav_path = Path(args.wav)
    else:
        wav_path = checkpoints_dir / "demo-tone-440hz.wav"
        print(f"3) Aucun --wav fourni : génération d'un ton de démo ({wav_path})…")
        synthesize_demo_wav(wav_path)
    print(f"   -> Son source : {wav_path} ({wav_path.stat().st_size} octets)")

    doc = {
        "schema": "ep.project.v1",
        "product": "ep133",
        "sounds": [{"slot": slot, "path": str(wav_path.resolve()), "name": "DEMO TONE"}],
        "pads": [{"group": "A", "pad": 2, "slot": slot}],
        "patterns": [
            {
                "id": "A01",
                "bars": 1,
                "events": [
                    {"tick": 0, "pad": 2, "note": 60, "velocity": 100, "duration": 480},
                ],
            },
        ],
    }

    print(f"4) Upload du son sur le slot {slot} (vérification octet à octet intégrée à ensure_sound_dependencies)…")
    plan = ensure_sound_dependencies(client, doc, base_dir=".", upload_missing=True, verify=True)
    print(f"   -> {plan}")

    print("5) Compilation du pad/pattern (base = état actuel du projet)…")
    compiled = compile_project(doc, base_archive=current_bytes)
    print(f"   -> {len(compiled)} octets")

    print(f"6) Écriture du projet P{args.slot:02d}…")
    client.write_project_archive(args.slot, compiled)
    written_bytes, _meta = client.read_project_archive(args.slot)
    if written_bytes != compiled:
        print(
            "   -> ÉCHEC : relecture du projet différente de ce qui a été écrit.\n"
            f"   Restaure avec : python3 tools/send_project_to_machine.py restore --slot {args.slot} --from {checkpoint_path}",
            file=sys.stderr,
        )
        sys.exit(1)
    print("   -> Identique octet à octet.")

    print("7) Activation (reload_project)…")
    result = client.reload_project(args.slot)
    print(f"   -> {result}")
    print()
    print(f"Succès. Son de démo uploadé sur le slot {slot}, assigné au pad A2 du projet P{args.slot:02d}.")
    print(f"Checkpoint de restauration : {checkpoint_path}")
    print("Le son du projet n'est pas encore prouvé écrit avant SCAN/écoute réelle — vérifier à l'oreille sur la machine.")


def cmd_copy_project(args: argparse.Namespace) -> None:
    """Copie un slot réel (déjà connu bon, fait sur la machine) vers un
    autre slot — sert à isoler si un problème vient du chemin d'écriture
    lui-même ou du contenu compilé par compile_project()."""
    if not args.confirm:
        print("Refus : ajoute --confirm pour écrire réellement sur la machine.", file=sys.stderr)
        sys.exit(1)

    root = Path(args.root)
    checkpoints_dir = root / "checkpoints"
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    client = FileClient()

    print(f"1) Lecture du slot source P{args.from_slot:02d}…")
    source_bytes, source_meta = client.read_project_archive(args.from_slot)
    print(f"   -> {len(source_bytes)} octets, meta={source_meta}")

    print(f"2) Lecture de l'état actuel du slot cible P{args.to_slot:02d} (checkpoint avant écriture)…")
    _current_bytes, checkpoint_path = checkpoint_project(client, args.to_slot, checkpoints_dir, tag="copie")
    print(f"   -> Checkpoint : {checkpoint_path}")

    print(f"3) Écriture de P{args.from_slot:02d} tel quel dans P{args.to_slot:02d} (write_project_archive)…")
    try:
        write_project_verified(client, args.to_slot, source_bytes)
    except RuntimeError as error:
        print(
            f"   -> ÉCHEC : {error}\n"
            f"   Restaure avec : python3 tools/send_project_to_machine.py restore --slot {args.to_slot} --from {checkpoint_path}",
            file=sys.stderr,
        )
        sys.exit(1)
    print("   -> Identique octet à octet à la source.")

    print(f"4) Activation (reload_project) de P{args.to_slot:02d}…")
    result = client.reload_project(args.to_slot)
    print(f"   -> {result}")
    print()
    print(f"Succès. P{args.to_slot:02d} contient maintenant une copie exacte de P{args.from_slot:02d}.")
    print(f"Checkpoint de restauration (ancien contenu de P{args.to_slot:02d}) : {checkpoint_path}")


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
    doc = minimal_test_document(args.slot, tar_bytes)
    compiled = compile_project(doc, base_archive=tar_bytes)
    print(f"   -> {len(compiled)} octets compilés")

    before = describe_archive(tar_bytes)
    after = describe_archive(compiled)
    changed = sorted(name for name in after if before.get(name) != after[name])
    removed = sorted(name for name in before if name not in after)
    print("5) Comparaison hors ligne (aucun trafic vers la machine à cette étape) :")
    print(f"   Membres modifiés/ajoutés : {changed or '(aucun)'}")
    print(f"   Membres supprimés        : {removed or '(aucun)'}")
    print(f"   Total avant : {len(before)} membres, {sum(len(payload) for payload in before.values())} octets")
    print(f"   Total après : {len(after)} membres, {sum(len(payload) for payload in after.values())} octets")
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
    current_bytes, checkpoint_path = checkpoint_project(client, args.slot, checkpoints_dir)
    print(f"   -> Checkpoint : {checkpoint_path}")

    print("2) Compilation du document de test (base = état actuel du slot)…")
    doc = minimal_test_document(args.slot, current_bytes)
    compiled = compile_project(doc, base_archive=current_bytes)
    print(f"   -> {len(compiled)} octets")

    print(f"3) Écriture du slot P{args.slot:02d} (write_project_archive)…")
    print("4) Relecture immédiate pour vérification octet à octet (avant toute activation)…")
    try:
        write_project_verified(client, args.slot, compiled)
    except RuntimeError as error:
        print(
            f"   -> ÉCHEC : {error}\n"
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
    try:
        write_project_verified(client, args.slot, tar_bytes)
    except RuntimeError as error:
        print(f"ÉCHEC : {error}", file=sys.stderr)
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

    write_sound = sub.add_parser("write-sound", help="Upload d'un son de démo + assignation à un pad (nécessite --confirm)")
    write_sound.add_argument("--slot", type=int, required=True, help="Numéro de projet (1-99)")
    write_sound.add_argument("--sound-slot", type=int, default=None, help="Slot son cible (1-999) ; auto-détecté (premier libre) si omis")
    write_sound.add_argument("--wav", default=None, help="Fichier WAV source ; sinon un ton de démo est généré")
    write_sound.add_argument("--confirm", action="store_true", help="Confirme explicitement l'écriture réelle")
    write_sound.set_defaults(func=cmd_write_sound)

    copy_project = sub.add_parser("copy-project", help="Copie un slot connu bon vers un autre slot (nécessite --confirm)")
    copy_project.add_argument("--from-slot", type=int, required=True, dest="from_slot")
    copy_project.add_argument("--to-slot", type=int, required=True, dest="to_slot")
    copy_project.add_argument("--confirm", action="store_true", help="Confirme explicitement l'écriture réelle")
    copy_project.set_defaults(func=cmd_copy_project)

    restore = sub.add_parser("restore", help="Restaure un checkpoint précédemment écrit")
    restore.add_argument("--slot", type=int, required=True)
    restore.add_argument("--from", dest="checkpoint", required=True, help="Chemin du fichier .tar de checkpoint")
    restore.set_defaults(func=cmd_restore)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
