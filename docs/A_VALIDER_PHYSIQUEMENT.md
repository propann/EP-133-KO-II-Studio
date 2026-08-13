# À valider physiquement — liste de suivi

> Liste vivante, pas un rapport figé : on coche au fur et à mesure. Créée le
> 13 août 2026 à la demande de l'utilisateur, pour rassembler en un seul
> endroit tout ce qu'un agent ne peut pas vérifier lui-même — soit parce que
> ça exige l'EP-133 réellement branché, soit parce que ça exige un vrai
> geste humain dans un navigateur (sélection de dossier, clic, écoute) que
> l'automatisation ne couvre pas encore.
>
> Ne duplique pas les rapports déjà clos (`VALIDATION_TRANSPORT.md`,
> `VALIDATION_CLONE_REEL.md`, `VALIDATION_SAVE_LOAD_STUDIO.md`,
> `VALIDATION_LECTEUR_PROJET_EP133.md`, `VALIDATION_SCORE_ET_EXTENSION.md`)
> — seulement ce qui reste ouvert.

## 1. Nécessite l'EP-133 physiquement branché

### Déjà validé (pour mémoire — ne pas refaire)

- Mapping MIDI des pads, groupes A–D, notification SysEx des boutons
  physiques A–D, PANIC 16 canaux — voir `CONNEXION_ET_CALIBRATION_MIDI.md`.
- Clone complet (9 projets, 527 sons, 536 hashes) et synchronisation
  incrémentale (30,7 s, zéro erreur) — voir `VALIDATION_CLONE_REEL.md`.
- Détection des dépendances manquantes son→pad, testée avec les 32 vrais
  pads d'une machine branchée (Q-13).
- Lecture du projet 1 réel (48 pads, 11 patterns, 125 notes, 3 scènes) —
  voir `VALIDATION_LECTEUR_PROJET_EP133.md`.

### Reste à faire

- [ ] **Plan de validation SysEx GREET/ECHO/écriture**, jamais commencé —
  les 10 étapes déjà définies dans `docs/REFERENCE_SYSEX_EP133.md`
  (Identity Request → GREET → ECHO → lecture métadonnées → capture A–D
  officielle → capture affectation son→pad → projet de test → transfert
  vers un slot sacrifiable → relecture/hash → double validation avant
  d'autoriser une fonction Studio).
- [ ] **Recouper le layout binaire du pad** (26 octets, offsets précis)
  documenté par `ep133-ppak/PROTOCOL.md` avec notre décodeur
  (`src/core/project/importers.ts`) — `etude/01_ECOSYSTEME_EP133.md`,
  REGISTRE_IDEES.md R-01. Lecture seule, comparaison uniquement.
- [ ] **Vérifier les taux d'échantillonnage LO/MID/HI du firmware 2.5** :
  enregistrer un son en mode `LO` (26 250 Hz) et `MID` (32 000 Hz) sur la
  machine réelle, comparer l'en-tête RIFF obtenu à celui d'un sample `HI`
  déjà analysé — `etude/05_FIRMWARE_2.5_IMPACT.md`, R-03.
- [ ] **Identifier durablement chaque machine** (Phase 3, ROADMAP.md) —
  au-delà du profil nommé localement, une vraie identité matérielle
  stable entre deux branchements.
- [ ] **Time Machine : restauration** (locale puis matérielle) — F-16/Q-16,
  jamais commencée. Nécessite un stockage versionné réel des PCM, pas
  seulement des métadonnées.
- [ ] **Phase 5 entière** : compiler un `.ppak` avec `kmorrill/ep-series-sysex`,
  charger une sauvegarde existante comme base, écrire dans un projet
  brouillon, checkpoint, relecture binaire. Bloquée dans un bac à sable
  sans machine ni archive réelle (constaté le 13 août) — nécessite un vrai
  poste avec l'EP-133 branché et un `.ppak` de test.
- [ ] **Synchroniser les affectations son→pad** après checkpoint,
  compilation et relecture (Phase 3) — verrouillé tant que la Phase 5
  n'a pas de compilateur validé.
- [ ] **Conversion et écriture d'un slot** (fin de Phase 4) : estimation de
  poids, choix de slot libre, sauvegarde du slot remplacé, écriture
  sérialisée, lecture de vérification.
- [ ] **Suivi du fader physique** (P-12) : capturer les messages CC réels
  avant de concevoir l'interface — rien de codé, juste une supposition à
  vérifier.
- [ ] **Lecture de l'identité/SKU** (F-02) : confirmer que `meta.json`
  d'une base réelle suffit, ne pas dépendre uniquement de l'Identity Reply
  MIDI générique.
- [ ] **Journal de diagnostic téléchargeable** (13 août, R-20, idée reprise
  de `etude/codex/`) — Test Machine → connecter l'EP-133 → actionner
  quelques contrôles physiques → bouton `⬇ TÉLÉCHARGER LE JOURNAL DE
  DIAGNOSTIC` en haut du panneau JOURNAL MIDI → vérifier que le fichier
  `.json` téléchargé contient bien les événements attendus (hex, horodatage,
  port) et s'ouvre proprement dans un éditeur de texte.

## 2. Nécessite un geste navigateur réel (pas la machine, mais pas automatisable ici)

### Déjà validé aujourd'hui par l'utilisateur

- [x] Forme d'onde + trim (`WaveformTrim`) : rendu, glisser de région,
  lecture — confirmé dans Chrome le 13 août.

### Reste à faire

- [ ] **Auto-trim silence + gain de normalisation suggéré** — ajoutés
  juste après la vérification ci-dessus, **pas encore revus à l'œil**.
  Chemin : Sons & Transfert → bibliothèque perso → bouton `〰` sur un
  fichier → bouton `✂ AUTO-TRIM SILENCE` doit caler la région sur le
  signal réel ; la ligne `CRÊTE … · GAIN SUGGÉRÉ …` doit apparaître sous
  les boutons.
- [ ] **Cadre de statut vert sur la page d'accueil** (13 août) — une fois
  l'EP-133 connecté, le cadre `EP‑133 PRÊT À CONNECTER` doit passer en cadre
  vert avec le texte `CONNECTÉ`, fond légèrement teinté (`color-mix`),
  lisible sur le fond beige de la page ; le point lumineux passe aussi de
  l'orange au vert. Jamais vu dans un vrai navigateur.
- [ ] **PWA installable** : jamais testée dans un vrai navigateur — ni
  l'invite d'installation Chrome, ni l'icône sur l'écran d'accueil, ni le
  fonctionnement réellement hors ligne une fois installée (R-05).
- [ ] **Campagne manuelle Chrome/Chromium, écran large et petit** — item
  ouvert de la Roadmap Phase 1 depuis le tout début du projet, jamais fait.
- [ ] **Portage du moteur de clone en TypeScript** (R-09, pas commencé) :
  une fois écrit, vérifier manuellement l'écriture de fichiers volumineux
  avec reprise, sans le pont Python.
- [ ] **Conversion EP-133 (resampling + dither + trim)** — ajoutée le 13 août
  après l'auto-trim/gain, elle aussi non revue. Chemin : même panneau
  `WaveformTrim` → section « CONVERSION EP-133 (SÉLECTION UNIQUEMENT) » en
  bas → boutons `LO`/`MID`/`HI` → un second lecteur audio doit apparaître
  avec le résultat converti, à comparer à l'oreille avec l'original (bouton
  `▶ ÉCOUTER` plus haut). Vérifié uniquement par des tests Node (WASM réel,
  métadonnées et enveloppe de signal correctes) — jamais écouté par une
  oreille humaine. Vérifier en particulier : le premier clic charge bien un
  gros module (~2 Mo) sans bloquer l'interface, la conversion respecte la
  sélection de trim en cours (pas tout le fichier), et le résultat sonne
  correctement rééchantillonné (pas de distorsion/aliasing perceptible).
  Ajouté depuis : chaque bouton LO/MID/HI affiche un poids estimé en Ko —
  vérifier qu'il varie bien en direct pendant qu'on ajuste la sélection.
  Ajouté depuis (2) : une machine déjà scannée fait apparaître « TIENT · X MO
  RESTANTS » ou « NE TIENT PAS · DÉPASSE DE X KO » sous le poids — à vérifier
  avec une vraie machine scannée, dans les deux cas (ça tient / ça ne tient
  pas), pas seulement le cas où il y a de la place.
  Ajouté depuis (3) : deux champs « FONDU ENTRÉE (MS) »/« FONDU SORTIE
  (MS) » au-dessus des boutons LO/MID/HI — à vérifier à l'oreille que le
  résultat converti fondu bien en douceur (pas de clic/craquement au point
  de jonction) avec des valeurs realistes (ex. 20-50 ms).
  Ajouté depuis (4) : section « MÉTADONNÉES DE PRÉPARATION » (mode
  ONE/KEYS/LEGATO, hauteur racine avec nom de note, BPM optionnel) — purement
  visuel pour l'instant (rien n'est écrit dans un fichier), à vérifier que
  les boutons de mode bien un seul actif à la fois, que le nom de note suit
  le numéro MIDI saisi, et que BPM vide affiche bien « INCONNU » plutôt
  qu'un zéro trompeur.

## Règle de suivi

Chaque case cochée ici doit pointer vers un vrai rapport si le résultat est
significatif (nouveau `VALIDATION_*.md`, ou une ligne mise à jour dans
`docs/REGISTRE_IDEES.md`) — cette liste n'est qu'un sommaire de ce qui reste
ouvert, pas le lieu où le détail d'une validation est raconté.
