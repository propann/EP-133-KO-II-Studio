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
- [x] **Premier aller-retour d'écriture réel** (13 août) — débloqué : lu
  P09 réel, checkpoint disque, compilé un pattern minimal par-dessus
  (base réelle), écrit, relu octet à octet identique, activé sur le
  firmware, **confirmé visuellement par l'utilisateur sur la machine**.
  `tools/send_project_to_machine.py`, détail dans
  `docs/SUIVI_IMPLEMENTATION.md`. Reste ouvert (Phase 5, `docs/ROADMAP.md`) :
  - [ ] écrire un vrai projet Studio complet (pas seulement une note de test) ;
  - [ ] scènes/Song mode/automation ;
  - [ ] conteneur `.ppak` autonome (`build_ppak()`, pas encore branché) ;
  - [ ] tester la commande `restore` en conditions réelles (jamais exercée,
    seule `write` l'a été) ;
  - [ ] un chemin depuis l'app web plutôt qu'un script CLI manuel.
- [ ] **Synchroniser les affectations son→pad** après checkpoint,
  compilation et relecture (Phase 3) — débloqué en principe (le
  compilateur a maintenant une première écriture réelle validée), pas
  encore fait.
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
- [ ] **Tout bouton bouge au clic** (13 août, règle globale) — cliquer
  n'importe quel bouton de l'app (SCAN, CLONER, CONNECTER, RESTAURER,
  onglets, boutons de dialogue...) doit visiblement l'enfoncer, pas
  seulement changer sa couleur. Vérifier en particulier les boutons
  n'ayant jamais eu de traitement dédié avant ce correctif (la plupart),
  et confirmer qu'aucun bouton à traitement déjà personnalisé (pads du
  jeu, cartes de la page d'accueil, façade Test Machine) n'a perdu son
  animation spécifique au passage.
- [x] **SCAN/CLONE en conditions réelles** (13 août) — pont relancé,
  clone complet lancé et mené à terme avec la vraie machine branchée
  (527/527 sons, 9/9 projets, 0 erreur, 24 min 47 s), SCAN déclenché en
  parallèle par l'utilisateur avec des chiffres identiques. Fusion de
  dossier nécessaire (le clone avait démarré sous un nom différent du nom
  déclaré) — détail complet et enseignement pour la prochaine fois dans
  `docs/VALIDATION_CLONE_REEL.md` § « Re-test du 13 août 2026 ».
- [ ] **Sauvegarde de la fiche personnage dans le dossier de travail**
  (13 août) — Fiche personnage → section « SAUVEGARDE DE LA FICHE » →
  bouton `SAUVEGARDER LA FICHE` : doit écrire `profile.json` à la racine
  du dossier de travail (visible dans l'explorateur de fichiers, à côté
  du sous-dossier `clone/`) ; modifier le pseudo ou l'avatar juste après
  doit mettre à jour ce fichier automatiquement, sans nouveau clic ni
  nouvelle invite de permission (miroir silencieux). Bouton `RESTAURER
  DEPUIS LE DOSSIER` : après confirmation, doit remplacer pseudo/machines/
  stats affichés par le contenu de `profile.json` — à tester en modifiant
  le fichier à la main entre les deux clics pour confirmer que la lecture
  est réelle, pas mémorisée en mémoire.
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

- [ ] **Journal MIDI affiché sur l'écran de la façade EP-133** (13 août,
  Test Machine) — les 3 derniers messages (type + hexadécimal tronqué)
  doivent défiler dans le petit écran OLED simulé, mis à jour en direct ;
  le panneau JOURNAL MIDI à droite est désormais un résumé compact
  (compteur + bouton de téléchargement), plus la liste détaillée complète.
  Jamais vu dans un vrai navigateur.
- [ ] **Touches qui « s'enfoncent » à l'écran** (13 août, Test Machine) —
  tout bouton de la façade doit visuellement bouger (translation dans le
  sens de l'ombre portée) au clic souris ET quand un message MIDI réel
  correspondant arrive de la machine, pas seulement changer de couleur.
  Jamais vu dans un vrai navigateur ni testé avec la machine branchée.
- [ ] **Pastille verte après débranchement réel** (13 août, correctif) —
  brancher l'EP-133, attendre la pastille verte, puis débrancher
  physiquement le câble : la pastille doit repasser grise/orange en
  quelques secondes (dépend de `access.onstatechange`, jamais observé sur
  un vrai débranchement, seulement simulé par Playwright). Si elle reste
  verte, le souci n'est plus le filtre par nom (corrigé) mais
  potentiellement `onstatechange` qui ne se déclenche pas sur ce
  navigateur/cette machine — à investiguer en conditions réelles.
- [ ] **Connexion SysEx automatique dès l'ouverture** (13 août) — deux cas
  à observer séparément dans un vrai navigateur : (1) après avoir déjà
  autorisé le SysEx une première fois (via un bouton CONNECTER), recharger
  la page ou revenir plus tard doit connecter la machine sans aucun clic ;
  (2) sur un navigateur/profil n'ayant JAMAIS autorisé le SysEx pour ce
  site, vérifier ce qui se passe réellement à l'ouverture (invite native
  affichée sans clic ? rien ne se passe et il faut un bouton CONNECTER
  ailleurs pour déclencher la demande ?) — comportement jamais observé,
  seulement raisonné.
- [ ] **Journal MIDI uniquement sur l'écran + bouton téléchargement dans
  le pied de page** (13 août) — page Test Machine : plus de panneau
  JOURNAL MIDI à droite ; le bouton `⬇ JOURNAL DE DIAGNOSTIC · N` doit
  apparaître dans le pied de page, désactivé tant qu'aucun message n'est
  reçu, actif et fonctionnel une fois des messages arrivés.
- [ ] **Bouton d'en-tête Test Machine remplacé par la pastille** (13 août)
  — vérifier que le cadre vert `CONNECTÉ`/`MIDI + SYSEX` apparaît bien à
  la même place que l'ancien bouton, avec la même logique de couleur que
  la page d'accueil.
- [ ] **Bouton CONNECTER restauré sur Test Machine** (13 août, correctif)
  — sur un navigateur/profil n'ayant jamais autorisé le SysEx, vérifier
  que le bouton `CONNECTER L'EP‑133` apparaît bien sous la pastille et que
  le cliquer déclenche réellement l'invite du navigateur puis connecte.
- [ ] **Contrôle qui « bouge » aussi quand la machine l'actionne**
  (13 août, correctif) — en mode CONFIGURER, mapper un contrôle physique
  (un knob ou un bouton non-A–D), repasser en mode test, actionner ce
  même contrôle sur la machine : le bouton virtuel correspondant doit
  visiblement s'enfoncer (~220 ms), pas seulement au clic souris. **Si ça
  ne bouge toujours pas** : télécharger le journal de diagnostic après
  deux pressions du même contrôle et comparer les deux hexadécimaux —
  s'ils diffèrent (compteur/checksum variable dans le SysEx), le souci
  n'est plus le timing mais la stabilité de la signature, pas encore
  résolu.
- [ ] **Projets Studio miroités sur le disque** (13 août) — Studio →
  Enregistrer (ou Enregistrer sous, Renommer, Dupliquer) un projet, puis
  vérifier l'apparition de
  `/home/azoth/Musique/OP-133/studio/<id>.ep.project.json` (le dossier de
  travail est déjà autorisé en écriture dans cette session, aucune
  nouvelle invite attendue). Supprimer ce projet depuis l'app, vérifier
  la disparition du fichier. Réimporter ce fichier via le bouton
  **Importer** pour confirmer le format round-trip. Vérifier aussi que
  l'archivage d'un projet NE supprime PAS son fichier (contrairement à la
  suppression définitive).
- [ ] **Badge de connexion cohérent sur le Studio** (13 août) — l'en-tête
  du Studio doit afficher le même badge vert que la page d'accueil/Test
  Machine/Fiche personnage une fois connecté, et un bouton `CONNECTER
  EP‑133` seulement si déconnecté (plus l'ancien bouton toujours visible).
- [x] **SCAN interroge maintenant la machine en direct** (13 août,
  correctif, testé en réel) — première utilisation navigateur de la
  commande FILE LIST. Premier test : compteur de sons correctement passé
  à 528 en direct, mais « PROJET P01 » affiché à l'écran alors que le
  manifeste écrit sur disque montrait bien le projet 9 — `deviceSoundIndex`
  (compteur) était mis à jour mais pas `deviceInventory` (numéro de projet
  affiché), deux états React séparés, un oubli. Corrigé le même jour.
  - [ ] **Reste à reconfirmer après le correctif** : recliquer SCANNER,
    vérifier que « PROJET P09 » s'affiche cette fois (pas seulement dans
    le fichier, à l'écran).
  - [ ] Vérifier aussi le repli sans SysEx actif (doit fonctionner comme
    avant, dernier instantané connu, sans erreur visible) — pas encore
    testé séparément.
- [ ] **Upload d'un son de démo** (13 août) — écouté par l'utilisateur,
  doute confirmé : ça n'a pas semblé marcher (pas le ton attendu sur
  P09 → groupe A → pad 2). **Test de comparaison fait** : copier un vrai
  projet (P01) tel quel vers P09 fonctionne parfaitement et sonne
  identique à P01 (confirmé par l'utilisateur) — le mécanisme
  d'écriture/lecture/activation n'est donc pas en cause. Piste ouverte,
  pas encore résolue : le document JSON minimal compilé par
  `compile_project()` pour le test du son manque probablement d'un ou
  plusieurs membres qu'un vrai projet contient toujours (réglages, FX,
  enveloppe) — à comparer précisément avec les membres présents dans P01
  avant de retenter.
- [x] **Glisser-déposer de projets (Sons & Transfert)** (13 août) —
  testé en vrai par l'utilisateur, transfert confirmé (« ça fait bien
  réagir la machine »). Reste à vérifier à l'occasion, pas bloquant :
  l'import machine → bibliothèque (glisser P01 vers la colonne droite)
  apparaît bien ensuite dans « Ouvrir… » du Studio avec le bon contenu —
  seule la direction logiciel → machine a été testée jusqu'ici.
- [ ] **SYNCHRONISER pour de vrai, deuxième essai après correctif**
  (13 août) — premier essai réel : échec systématique avant même
  d'atteindre l'écriture (`onGetActiveProject` en timeout MIDI côté
  navigateur, machine diagnostiquée saine en Python en parallèle). Corrigé
  en retirant cette dépendance : SYNCHRONISER utilise maintenant un
  **sélecteur de projet explicite** (nouveau `<select>` dans l'en-tête
  GROUPES & PADS, par défaut le dernier projet scanné). À revérifier :
  le sélecteur liste bien les 9 projets (présent/vide), le `window.confirm`
  annonce le bon projet choisi et le bon décompte, glisser un son perso
  sur un pad puis confirmer rend le son audible sur la machine, une
  réaffectation pure (son déjà sur la machine déplacé vers un autre pad,
  sans nouveau fichier) fonctionne aussi. Une fois confirmé, cocher la
  case correspondante dans `docs/ROADMAP.md` Phase 4.
- [ ] **Affichage live MIDI limité au groupe actif** (13 août, correctif)
  — jouer un pad du groupe actuellement affiché doit le surligner
  brièvement sans rien changer d'autre ; jouer un pad d'un **autre**
  groupe ne doit plus faire sauter l'onglet actif vers ce groupe (avant :
  l'affichage changeait de groupe tout seul, jugé illisible).
- [ ] **Repliement GROUPES & PADS / transfert de projets** (13 août) —
  ajusté juste après le premier test (cartes machine en orange, flèches
  de repliement partageant l'emplacement avec le transfert de projets) —
  pas encore revu à l'œil après ce changement précis.
- [ ] **Groupe A–D en surbrillance sur l'écran de la façade** (13 août,
  correctif) — appuyer sur un bouton physique A–D de l'EP-133 doit faire
  passer la bonne lettre en gras sur l'écran simulé de Test Machine
  (jamais vérifié avec un vrai bouton) ; cliquer un bouton de groupe
  A–D sur cette page doit aussi mettre à jour le groupe visible sur les
  autres pages (Studio, Sons & Transfert) sans recharger.
- [ ] **Statut de connexion identique sur toutes les pages** (13 août,
  correctif) — brancher/connecter l'EP-133 depuis une page, puis naviguer
  vers Accueil, Test Machine, Sons & Transfert, Fiche personnage, Studio
  (bouton MIDI OUT) et Rhythm Hero (bouton MIDI compact) : le badge/bouton
  doit afficher « connecté » partout en même temps, sans qu'aucune page ne
  reste sur « CONNECTER ». Idem au débranchement (doit repasser
  « déconnecté » partout).
- [ ] **Passe d'arrondis généralisée** (13 août) — bordures droites
  remplacées par `border-radius` (jetons `--radius`/`--radius-sm`/
  `--radius-xs`) sur ~60 éléments dans tout le Studio (dialogues, boutons,
  badges, panneaux Documentation/Sons/Clone/Editor). Quelques éléments
  volontairement laissés carrés (séparateurs `border-top`/`border-bottom`
  seuls, cellules de grille à bordure partielle) — à relire à l'œil pour
  confirmer qu'aucun angle ne reste incohérent avec le reste de l'interface.

- [x] **GROUPES & PADS suit le projet sélectionné, pas seulement le
  dernier scan** (13 août, correctif) — confirmé par l'utilisateur :
  « le sélecteur de projets marche parfaitement ».
- [ ] **La grille se resynchronise après une écriture SYNCHRONISER
  réussie** (13 août, correctif du même jour) — premier test réel (écrit
  sur P02, « 1 PAD(S) ÉCRIT(S) » affiché) a montré que la grille restait
  figée sur l'état d'avant écriture malgré le succès annoncé ; corrigé en
  forçant une relecture (`/bridge/projects/read`) juste après chaque
  écriture réussie, plus systématiquement à chaque sélection de projet
  (retiré le raccourci qui faisait confiance à `inventory.pads` quand le
  projet visé égalait le dernier scan). À revérifier : écrire une
  réaffectation ou un son sur un pad, confirmer, et voir la grille
  refléter IMMÉDIATEMENT le nouveau slot sur ce pad sans avoir à changer
  de sélecteur ni relancer un SCAN.

## Règle de suivi

Chaque case cochée ici doit pointer vers un vrai rapport si le résultat est
significatif (nouveau `VALIDATION_*.md`, ou une ligne mise à jour dans
`docs/REGISTRE_IDEES.md`) — cette liste n'est qu'un sommaire de ce qui reste
ouvert, pas le lieu où le détail d'une validation est raconté.
