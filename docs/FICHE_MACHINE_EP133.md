# Fiche machine — EP-133 K.O. II

Relevé technique de l'unité réellement branchée sur la machine de
développement Linux, le 11 août 2026. Tout ce document vient de commandes
de diagnostic **en lecture seule** (`lsusb`, `udevadm`, `amidi`, `aconnect`,
`wpctl`, `arecord`/`aplay`) — aucune n'écrit sur la machine. But : garder
une identité matérielle stable pour cette unité plutôt que de la redécouvrir
à chaque session, en complément (pas en remplacement) de la fiche
personnage de l'écosystème Studio, qui reste la source déclarative
(nom choisi par l'utilisateur, mémoire déclarée).

## Identité USB

| Champ | Valeur |
|---|---|
| Fabricant | teenage engineering (`idVendor` `0x2367`) |
| Produit | EP-133 (`idProduct` `0x8020`) |
| Numéro de série | `E3PUH1F8` |
| USB | 2.00, alimenté par le bus, 500 mA max |
| Chemin USB | `pci-0000:00:14.0-usb-0:2` (dépend du port physique utilisé) |

Le numéro de série (`iSerial` = `E3PUH1F8`) est le seul identifiant
vraiment stable d'une unité à l'autre si l'utilisateur en déclare plusieurs
dans sa fiche personnage — le chemin USB, lui, change si la machine est
débranchée d'un port et rebranchée sur un autre.

## Interfaces USB (4)

1. **Audio Control** — routage entre deux entrées USB Streaming et une
   sortie Speaker / Digital Audio Interface.
2. **Audio Streaming IN** — EP-133 → ordinateur, PCM 16 bits, 48 kHz,
   stéréo (endpoint isochrone).
3. **Audio Streaming OUT** — ordinateur → EP-133, même format, avec
   endpoint de feedback.
4. **MIDI Streaming** — classe USB-MIDI 1.0 standard, endpoints **bulk**
   (pas interrupt), paquets de 32 octets, un jack IN et un jack OUT
   embarqués. Aucune interface HID ou vendor-specific séparée détectée au
   niveau USB : les notifications propriétaires des boutons de façade A–D
   transitent en SysEx sur cette même interface MIDI, pas sur un canal à
   part (confirmé par le diagnostic MIDI du 10 août, voir
   `RAPPORT_SESSION_2026-08-10.md`).

## Noms système (Linux / ALSA / PipeWire)

| Sous-système | Nom exact |
|---|---|
| Carte ALSA | `EP133` / affichage `EP-133` (carte 1) |
| Port MIDI ALSA | `hw:1,0,0` — client `EP-133`, port `EP-133 MIDI 1` |
| Client `aconnect` | `client 20: 'EP-133' [type=noyau,card=1]` |
| Périphérique audio | `EP-133`, capture et lecture (`EP-133 Stéréo analogique`) |

`aconnect -l` sert aussi de test rapide « une autre instance
gêne-t-elle ? » : si le port `EP-133 MIDI 1` apparaît avec une ligne
`Connecté Depuis`/`Connexion À` pointant vers un client inattendu, quelque
chose d'autre a déjà la main dessus.

## Inventaire scanné (le plus récent connu)

Depuis `public/ep133-device.json` / `public/ep133-sound-index.json`,
scan en lecture seule :

| Champ | Valeur | Scanné le |
|---|---|---|
| Projet actif | P01 | 2026-08-09 18:14 UTC |
| Sons indexés | 527 | 2026-08-09 20:56 UTC |
| Mémoire occupée | 56 214 010 octets (56,21 Mo) | 2026-08-09 20:56 UTC |

Un clone complet (projets + PCM) a été validé sur cette même unité le
10 août : 9 projets, 527 sons, 536 hachages contrôlés — voir
`VALIDATION_CLONE_REEL.md`. Ce document-ci ne duplique pas ce détail, il
donne juste le repère machine qui permet de savoir de quelle unité ces
chiffres parlent.

## Comment mettre à jour cette fiche

```bash
lsusb -v -d 2367:8020      # identité USB, interfaces, numéro de série
amidi -l                    # port MIDI ALSA
aconnect -l                 # qui est connecté au port EP-133 en ce moment
wpctl status                # audio PipeWire
udevadm info --query=all --name=/dev/bus/usb/BBB/DDD   # chemin USB exact
```

Remplacer `BBB`/`DDD` par le bus/périphérique donné par `lsusb`. Aucune de
ces commandes ne modifie quoi que ce soit sur la machine ni sur
l'ordinateur.
