# Fiche machine — EP-133 K.O. II

Relevé technique de l'unité réellement branchée sur la machine de
développement Linux, le 11 août 2026. Vient de deux familles de commandes,
toutes **en lecture seule** — aucune n'écrit sur la machine : le diagnostic
système (`lsusb`, `udevadm`, `amidi`, `aconnect`, `wpctl`) et les vrais
outils de scan du projet (`tools/scan_ep133_readonly.py`,
`tools/scan_ep133_library_readonly.py`), relancés pendant cette session
pour confirmer qu'ils fonctionnent toujours et documenter précisément ce
qu'ils renvoient. But : garder une identité matérielle stable et une
référence de protocole pour cette unité plutôt que de la redécouvrir à
chaque session, en complément (pas en remplacement) de la fiche personnage
de l'écosystème Studio, qui reste la source déclarative (nom choisi par
l'utilisateur, mémoire déclarée).

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

USB 1.1 Full Speed (`12M`, pas les 480M High Speed que la puce racine
supporte) — cohérent avec un débit audio stéréo 16 bits + MIDI bulk, pas
besoin de plus. Les 4 interfaces sont prises en charge par le **même**
pilote noyau, `snd-usb-audio` (confirmé par `lsusb -t`) — Linux ne voit
donc pas l'EP-133 comme deux périphériques distincts (audio + MIDI), c'est
un seul pilote qui expose les deux faces.

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

## Inventaire scanné

Scan de confirmation relancé le 11 août avec les vrais outils du projet
(`tools/scan_ep133_readonly.py`, `tools/scan_ep133_library_readonly.py`,
voir plus bas) plutôt que de se fier uniquement aux fichiers déjà présents
dans `public/` :

| Champ | Valeur | Scanné le |
|---|---|---|
| Projet actif | P01 (32 pads utilisés) | 2026-08-11 16:13 UTC |
| Sons indexés (bibliothèque globale) | 527 | 2026-08-11 16:14 UTC |
| Mémoire occupée | 56 214 010 octets (56,21 Mo) | 2026-08-11 16:14 UTC |

**Chiffres strictement identiques** au scan du 9-10 août
(`public/ep133-device.json`/`ep133-sound-index.json`, voir
`VALIDATION_CLONE_REEL.md`) — la bibliothèque de cette unité n'a pas bougé
entre les deux scans, aucune écriture n'a eu lieu sur la machine dans
l'intervalle, cohérent avec la discipline « lecture seule » du projet.

### Ce qu'un scan de projet révèle par pad (protocole FILE)

Chaque pad scanné (`tools/scan_ep133_readonly.py`) expose ces champs —
observés sur les 32 pads utilisés du projet 1 :

| Champ | Rôle | Valeurs observées ici |
|---|---|---|
| `slot` | numéro de son affecté (1-999) | 32 valeurs différentes, dont 49, 103–104, 205–207, 301, 323–349... |
| `midiChannel` | canal MIDI du pad | toujours `0` (canal 1) sur ce projet |
| `amplitude` | volume, 0–100 | très majoritairement `100`, un exemple à `90` |
| `pitch` | transposition en demi-tons, signée | majoritairement `0`, un exemple à `-4` |
| `pan` | balance stéréo | `0` (centré) sur tous les pads observés |
| `attack` / `release` | enveloppe simple | `attack` à `0`, `release` à `255` (max) ou `128` selon le pad |
| `timeMode` | — | toujours `0` ici, signification exacte pas encore confirmée |
| `chokeGroup` | groupe d'étouffement (ex. charley ouverte/fermée) | `0` (aucun) ou `1` — au moins deux pads du groupe A partagent le groupe `1` |
| `playMode` | `0` = ONE, `1` = KEYS, `2` = LEGATO | confirme exactement le mapping déjà utilisé dans `studioLibrary.ts` |
| `rootNote` | note MIDI de référence pour la lecture accordée | très majoritairement `60` (Do central), mais `26`, `31` et `57` observés aussi — certains sons sont donc bien accordés sur une hauteur précise, pas tous calés par défaut |

### Ce qu'un scan de bibliothèque révèle par son

`tools/scan_ep133_library_readonly.py` donne, en plus du numéro de slot et
du poids en octets, des métadonnées par son : `name` (nom lisible, ex.
`909kick11`, `snare lo`, `bongo mid 4`), `channels` (mono `1` ou stéréo
`2`), `samplerate`, `playMode` (`oneshot`/`key`/`legato`, la version texte
du champ numérique ci-dessus) et `rootNote`.

**Trouvaille technique** : deux fréquences d'échantillonnage cohabitent
dans la bibliothèque de cette unité — `44100` Hz (standard CD) et `46875`
Hz, une fréquence non standard. Hypothèse la plus probable : `46875` Hz est
la fréquence native interne de l'EP-133 pour son contenu d'usine, `44100`
Hz apparaissant sur des sons importés/réenregistrés à la fréquence standard
de l'ordinateur. Pas encore confirmé auprès de la documentation officielle
— à vérifier avant de s'appuyer dessus pour un calcul de durée ou de
pitch.

## Comment mettre à jour cette fiche

### Diagnostic système (aucune dépendance à installer)

```bash
lsusb -v -d 2367:8020      # identité USB, interfaces, numéro de série
lsusb -t                    # pilote noyau attaché à chaque interface
amidi -l                    # port MIDI ALSA
aconnect -l                 # qui est connecté au port EP-133 en ce moment
wpctl status                # audio PipeWire
udevadm info --query=all --name=/dev/bus/usb/BBB/DDD   # chemin USB exact
```

Remplacer `BBB`/`DDD` par le bus/périphérique donné par `lsusb`.

### Scan réel du contenu (protocole FILE, lecture seule)

Vérifié fonctionnel le 11 août avec l'environnement décrit dans
`docs/PONT_LOCAL_CLONAGE.md` :

```bash
python3 -m venv /tmp/ep133-scan-venv
/tmp/ep133-scan-venv/bin/pip install -r tools/requirements-scanner.txt

/tmp/ep133-scan-venv/bin/python tools/scan_ep133_readonly.py \
  --project 1 --port EP-133 --out /tmp/ep133-device-fresh.json
/tmp/ep133-scan-venv/bin/python tools/scan_ep133_library_readonly.py \
  --port EP-133 --out /tmp/ep133-sound-index-fresh.json
```

Écrit dans `/tmp`, jamais directement dans `public/` par ce chemin — pour
publier un scan à jour dans l'appli, comparer d'abord le résultat au
fichier existant puis remplacer `public/ep133-device.json`/
`ep133-sound-index.json` volontairement, pas automatiquement.

Aucune de ces commandes, ni celles du diagnostic système, ne modifie quoi
que ce soit sur la machine ni sur l'ordinateur.
