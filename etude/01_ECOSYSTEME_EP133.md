# Écosystème communautaire EP-133 / EP-40 / EP-1320 — état du 13 août 2026

> Complète `docs/REFERENCE_SYSEX_EP133.md` et
> `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md`. Les dépôts déjà connus de ces
> documents sont réévalués ici avec leur état actuel ; les nouveaux dépôts
> trouvés sont marqués **NOUVEAU**.

## Légende

- **Recommandation** : `ÉTUDIER` (lire/recouper sans dépendre), `SURVEILLER`
  (veille passive), `RÉFÉRENCER` (citer comme prior art, ne pas copier),
  `NE JAMAIS INTÉGRER` (risque explicite pour la machine).
- Aucune ligne de ce tableau n'autorise une écriture matérielle : c'est une
  cartographie de sources, pas une liste de dépendances déjà validées.

## Dépôts directement dédiés à l'EP-133/EP-40/EP-1320

### kmorrill/ep-series-sysex

- URL : <https://github.com/kmorrill/ep-series-sysex>
- Licence : **MIT**.
- Langage : Python (stdlib pour le cœur, `mido`/`python-rtmidi` optionnels).
- État : maintenu, **vérifié sur firmware 2.5.1** (le nôtre visait un état
  antérieur). Déjà notre dépendance stratégique documentée (Q-04 dans
  `docs/REGISTRE_IDEES.md`) et déjà utilisée en lecture seule par
  `tools/scan_ep133_readonly.py`.
- Apport nouveau depuis notre dernière analyse : le projet propose désormais
  une **écriture réelle vers l'appareil avec relecture et vérification octet
  par octet**, un mode « live write » à faible latence, une suite de tests
  matériels (capture audio USB, oracles MIDI), et une gestion de bibliothèque
  de samples partagée (slots 1–999). C'est exactement le socle que la Phase 5
  de notre feuille de route doit encore construire (compilation `.ppak`,
  checkpoint, écriture, relecture).
- Structure : `docs/` (protocole, format fichier, conteneur PAK, schéma
  JSON, tests matériels), `epsysex/` (package Python), `examples/`,
  `tests/`, `tools/` (CLI compiler/lire/écrire/gérer la bibliothèque).
- Recommandation : **ÉTUDIER en priorité** pour la Phase 5. Voir
  [04_RECOMMANDATIONS_INTEGRATION.md](04_RECOMMANDATIONS_INTEGRATION.md).

### ZacharySBrown/ep133-ppak

- URL : <https://github.com/ZacharySBrown/ep133-ppak> — voir
  `PROTOCOL.md`.
- Auteur : zak@raindog.ai, projet **StemForge** (outil IA de séparation de
  stems, sans lien direct avec l'EP-133 au-delà de cette spécification).
- Licence : **MIT** (fichier `LICENSE` confirmé lors d'une deuxième passe de
  recherche le 13 août 2026 — corrige la première lecture de cette étude, qui
  la laissait non confirmée).
- Date : document daté du 25 avril 2026. **NOUVEAU** par rapport à notre
  analyse existante.
- Apport : documentation très détaillée et testée (100+ tests Python) :
  - format de trame SysEx (identique à ce que nous avons déjà documenté) ;
  - **enregistrement de pad à 26 octets avec offsets précis** : offset 1
    (slot), 8–11 (longueur u32 LE), 12–15 (BPM float32 LE), 16 (volume),
    20 (release), 23 (playmode) — à comparer champ par champ avec notre
    décodeur (`src/core/project/importers.ts`) qui note actuellement
    « 26 ou 27 octets » sans tous les offsets ;
  - une **formule FileId différente** de la nôtre :
    `pad_fid = 3200 + (project-1)×1000 + group_index×100 + pad_num`, à
    recouper avec la formule actuelle documentée dans
    `docs/REFERENCE_SYSEX_EP133.md` (`projects:2000, groups:P+100, A:P+200…`)
    — les deux ne sont pas forcément incompatibles (bases différentes),
    mais méritent une vérification croisée avant d'en tirer une conclusion ;
  - un piège de convention documenté : la numérotation des pads est
    **descendante en SysEx** (pad 1 = touche « 7 ») mais **ascendante dans
    les TAR de projet** (`p01` = touche « . »), source d'erreurs silencieuses
    si on mélange les deux ;
  - règle de sécurité explicite : ne jamais synthétiser un `.ppak` depuis
    rien, toujours partir d'une vraie archive de Sample Tool comme base —
    règle que notre projet applique déjà (`REGISTRE_IDEES.md` F-04).
  - Crédite `phones24`, `icherniukh`, `garrettjwilke` et d'autres via son
    `ACKNOWLEDGMENTS.md`.
- Recommandation : **ÉTUDIER** pour corriger/compléter le layout binaire du
  pad dans `docs/REFERENCE_SYSEX_EP133.md`, en confirmant chaque offset par
  un test aller-retour sur notre propre projet réel avant modification du
  décodeur.

### garrettjwilke/ep_133_sample_tool

- URL : <https://github.com/garrettjwilke/ep_133_sample_tool>
- Déjà connu (`docs/REFERENCE_SYSEX_EP133.md`). Outil Electron hors ligne,
  **archivé le 1ᵉʳ août 2026**. Reste la source primaire du protocole
  `GREET`/`ECHO`/FILE que nous documentons déjà.
- Recommandation : `RÉFÉRENCER` (déjà fait), pas de changement.

### pbarilla/ep_133_sample_tool (fork)

- Déjà connu. Fork mis à jour en mai 2026, annoncé compatible plusieurs
  appareils EP. Pas de nouvel élément trouvé cette session au-delà de ce que
  `docs/REFERENCE_SYSEX_EP133.md` note déjà.
- Recommandation : `SURVEILLER`.

### szeraf/ep_1320_sample_tool — **NOUVEAU**

- URL : <https://github.com/szeraf/ep_1320_sample_tool>
- Fork du Sample Tool adapté pour l'**EP-1320 Medieval**, le produit frère
  sorti en 2026 (128 Mo dont 96 Mo de sons médiévaux câblés en usine). Le
  README précise que l'outil a été commencé la veille de la sortie de
  l'EP-1320 et que l'outil garrettjwilke d'origine ne reconnaît pas du tout
  l'EP-1320.
- Fonctionnalités notées : 100 % hors ligne, pack de sons factory inclus
  (d'où un exécutable > 100 Mo), sauvegarde « projets seulement », zoom
  interface amélioré.
- Intérêt pour nous : confirme que l'**EP-1320 partage une bonne partie du
  protocole EP-133/EP-40** (cf. aussi le fil OP Forums ci-dessous, où
  kmorrill cherche justement des retours EP-1320). C'est un candidat naturel
  pour une future extension multi-appareils de notre Studio, sur le même
  modèle que `docs/VISION_OP1.md` envisage pour l'OP-1.
- Recommandation : `SURVEILLER` activement ; envisager une ligne dédiée dans
  `docs/VISION_OP1.md` ou un nouveau document `VISION_EP1320.md` si une
  vraie demande utilisateur apparaît.

### phones24/ep133-export-to-daw

- URL : <https://github.com/phones24/ep133-export-to-daw> — démo en ligne
  <https://ep133-to-daw.cc/>.
- Déjà connu (`docs/ANALYSE_ETUDE_CAHIER_CHARGES.md`, licence AGPL-3.0 déjà
  actée par l'équipe). Confirmé cette session : **écrit en TypeScript**,
  fonctionne uniquement avec un navigateur supportant WebMIDI (même
  contrainte que nous), et exporte depuis **EP-133, EP-1320 et EP-40** (pas
  seulement l'EP-133) vers :
  - Ableton Live 11.3.35+ (enveloppe, points de trim, stretching, modes de
    lecture, export arrangement ou clips de session, paramètres de fader,
    départs/retours FX) ;
  - DAWproject (arrangement avec clips, échantillons archivés, 4 groupes
    comme sur la machine) ;
  - REAPER ;
  - MIDI (fichier + échantillons archivés).
- Recommandation : `RÉFÉRENCER` — c'est la référence d'architecture la plus
  proche de notre propre stack (même langage), mais son AGPL-3.0 interdit
  toujours la reprise de code sans assumer les obligations associées. Voir
  [03_FORMATS_DAW_ET_EXPORT.md](03_FORMATS_DAW_ET_EXPORT.md).

### phones24/SimpleCC — **NOUVEAU**

- URL : <https://github.com/phones24/SimpleCC>
- Plugin MIDI CC utilisé pour l'automation, par le même auteur que
  `ep133-export-to-daw`. Pas encore étudié en profondeur cette session.
- Recommandation : `SURVEILLER`, à ouvrir si le chantier d'automation de
  fader (P-03/P-05 dans `docs/REGISTRE_IDEES.md`) redémarre.

### DannyDesert/EP133-skill

- URL : <https://github.com/DannyDesert/EP133-skill>
- Déjà connu. Licence **MIT**. Compétence Claude Code générant des `.ppak`
  par script Python (`create_ppak.py`) : timing 96 PPQN, événements 8
  octets, organisation par groupes A–D. Dépend de l'EP Sample Tool officiel
  et de Claude Code/Desktop.
- Recommandation : `ÉTUDIER` comme seconde référence de génération `.ppak`,
  en complément de `kmorrill/ep-series-sysex`, pour croiser les structures
  avant d'implémenter notre propre compilateur en Phase 5.

### benjaminr/mcp-koii

- URL : <https://github.com/benjaminr/mcp-koii>
- Déjà connu. Serveur **MCP** (Model Context Protocol) en Python (`mido`)
  qui pilote l'EP-133 par MIDI depuis un assistant IA (Claude) en langage
  naturel : jouer des pads par nom/note/label, patterns de batterie.
- Recommandation : `RÉFÉRENCER` comme inspiration de contrôle MIDI conversationnel
  (pas pour le décodage de projet), déjà noté ainsi dans
  `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md`.

### seajaysec/ep-unity

- URL : <https://github.com/seajaysec/ep-unity>
- Déjà connu, mais approfondi cette session. Outil navigateur qui permet de
  **flasher un firmware EP-40 sur un EP-133 (ou l'inverse)** en réécrivant 4
  octets de l'en-tête SKU d'un fichier `.tfw` (offsets 15–18, situés avant la
  zone couverte par le CRC-16/XMODEM, donc sans besoin de recalculer la
  somme de contrôle), puis en le flashant via WebMIDI DFU.
- Avertissements documentés par l'auteur et par Teenage Engineering :
  **risque de perte de données, de brick et d'annulation de garantie**. Testé
  seulement sur un EP-133 64 Mio « legacy » ; les variantes de densité de
  flash NOR entre appareils créent des incompatibilités imprévisibles.
  États d'erreur documentés : `RDY` bloqué (récupérable), `ERR SoUnD`
  (corruption du système de fichiers utilisateur), `ERR SYSTEM_MODEL`
  (restauration trop volumineuse).
- Contient aussi des analyses de recherche pure (cryptanalyse MCUboot/ECIES,
  rétro-ingénierie des trailers LittleFS) expliquant pourquoi certaines
  approches de modification restent hors de portée — utile comme lecture de
  fond, sans lien avec une fonctionnalité produit.
- Recommandation : **`NE JAMAIS INTÉGRER` le code ou la fonctionnalité**
  (SKU rewrite, DFU) dans le Studio. Aucune fonction de ce type ne doit
  apparaître dans l'interface, conformément à la règle déjà actée
  « DFU/firmware : hors périmètre » de `docs/REFERENCE_SYSEX_EP133.md`. La
  documentation de recherche peut être lue à titre personnel, jamais citée
  comme source d'une fonctionnalité du Studio.

### te-archive/ep-133_firmware — **NOUVEAU**

- URL : <https://github.com/te-archive/ep-133_firmware>
- Dépôt d'archive, très peu de métadonnées visibles (pas de description, pas
  de licence affichée dans l'aperçu consulté). Semble être une simple
  archive de fichiers firmware `.tfw` au fil des versions.
- Recommandation : `SURVEILLER`. Utile en théorie pour dater précisément les
  changements de protocole entre firmwares (ex. l'apparition des taux
  d'échantillonnage LO/MID/HI en 2.5), mais son contenu réel n'a pas pu être
  vérifié depuis l'extérieur cette session — à explorer directement avant de
  s'y fier.

### icherniukh/ep133-krate — localisé (13 août, deuxième session)

- **Résolu** : une étude parallèle indépendante (`etude/codex/`, menée par
  un autre agent sur ce même dépôt le 13 août) a localisé le dépôt sous
  <https://github.com/icherniukh/ep133-krate> — confirmé par une recherche
  séparée avant d'écrire cette ligne, pas repris tel quel. Gestionnaire de
  samples CLI/TUI, MIT annoncée, actif (188 commits, 486 tests sans
  matériel selon l'étude parallèle — non revérifié chiffre par chiffre ici).
- Apports techniques notables, à recouper avant tout code :
  - confirme que le transfert audio utilise du PCM signé little-endian
    reconditionné en **Packed7** — cohérent avec nos propres fonctions
    `pack7`/`unpack7` déjà implémentées dans
    `src/core/midi/useWebMidi.ts` (validation croisée, pas juste une
    coïncidence de nom) ;
  - documente explicitement que **le groupe A est mieux capturé que
    B/C/D**, plusieurs commandes restant inconnues sur ces groupes — un
    rappel utile : un mapping validé sur le groupe A ne doit jamais être
    généralisé automatiquement aux groupes B/C/D sans capture séparée ;
  - signale que des métadonnées peuvent devenir obsolètes après une
    suppression, et que l'appareil peut rester dans un état de transfert
    nécessitant une réinitialisation — utile pour concevoir de futurs
    tests de robustesse d'écriture, pas pour contourner une protection.
- Recommandation : `ÉTUDIER`. Source B (corroborée) plutôt que A (observée
  directement par nous) tant que ses tests n'ont pas été relus ligne à
  ligne ; à recouper avec `kmorrill/ep-series-sysex` et notre propre
  décodeur avant tout changement de code.

### gabriel-roth/knockout — toujours introuvable, confirmé par deux recherches indépendantes

- Cité comme antériorité par plusieurs sources communautaires (dont les
  crédits du fil OP Forums de `kmorrill`), mais son URL historique ne
  répond pas — vérifié séparément par cette étude et par `etude/codex/`,
  même conclusion des deux côtés : `SURVEILLER` seulement, ne jamais citer
  comme une dépendance ou une preuve.
- **Désambiguïsation trouvée en vérifiant** : un article grand public
  (Yahoo/MusicRadar, 10 avril 2025) titre « Teenage Engineering drops a
  knockout update » à propos de la mise à jour **OS 2.0 (« Champions
  update »)** — resampling, Song Mode, polyphonie 16 voix mono/12 stéréo,
  MIDI sidechaining. « Knockout » y est un jeu de mots journalistique, pas
  un nom de firmware ni un dépôt — à ne pas confondre avec le dépôt
  `gabriel-roth/knockout` introuvable, ni avec le nom du produit K.O. II
  lui-même.

## Discussion communautaire de référence

### OP Forums — « Opening up the EP series for third-party development »

- URL : <https://op-forums.com/t/opening-up-the-ep-series-for-third-party-development/31759>
- Fil lancé par **kmorrill**, qui sert de point de convergence de tout
  l'écosystème listé ci-dessus (crédite explicitement `ep133-ppak`,
  `ep133-krate`, `knockout`, `ep133-export-to-daw`). Documentation vérifiée
  contre du matériel EP-133 **et EP-40** réel sous OS 2.5.1. L'auteur
  cherche des retours pour étendre le support à l'**EP-1320 Medieval**, sous
  l'hypothèse d'un format partagé.
- Cas d'usage envisagés par la communauté : éditeurs visuels, conversion de
  projets, séquenceurs génératifs, effets externes, et génération assistée
  par IA de contenu sonore dépassant les capacités matérielles — une
  direction produit proche de l'esprit « Learning & Project OS » déjà retenu
  dans `docs/REGISTRE_IDEES.md` (Q-05).
- Recommandation : `SURVEILLER` en continu. C'est actuellement le meilleur
  point d'entrée pour toute nouvelle capture SysEx communautaire.

## Écosystème adjacent (autres machines Teenage Engineering)

### schollz/teoperator (OP-1 / OP-Z)

- Génère des patchs de batterie/synthé OP-1 et OP-Z à partir de n'importe
  quel son, avec un decodage des métadonnées propriétaires des patchs.
  Existe en CLI et en service web (teoperator.com).
- Intérêt : pas un dépôt EP-133, mais un **patron de fonctionnalité**
  transposable — « générer un kit de pads à partir d'un son/dossier » est
  une idée déjà proche de A-13 (affectation automatique des slices) dans
  notre registre. Utile comme référence de conception, pas de code.
- Recommandation : `RÉFÉRENCER` comme inspiration produit.

### MarkRdgOx/opzdoc (OP-Z)

- Documentation communautaire du décodage SysEx de l'OP-Z (propriétés de
  son, contrôle de volume). Confirme que Teenage Engineering réutilise des
  patrons SysEx propriétaires similaires d'un appareil à l'autre — cohérent
  avec notre propre préfixe `F0 00 20 76 33 40` déjà documenté.
- Recommandation : `SURVEILLER`, utile seulement si le Studio s'étend un
  jour à l'OP-Z (hors périmètre actuel, voir `docs/VISION_OP1.md`).

### christofmuc/KnobKraft-orm

- Librairie/éditeur SysEx **multi-appareils** open source (C++/Python,
  architecture à adaptateurs par appareil). Pas spécifique à Teenage
  Engineering.
- Intérêt : **patron d'architecture**, pas de code à intégrer. Si le Studio
  doit un jour gérer EP-133 + EP-40 + EP-1320 (et potentiellement OP-1) avec
  un cœur commun et des adaptateurs par appareil, KnobKraft Orm est un bon
  exemple vérifié en production de cette séparation.
- Recommandation : `RÉFÉRENCER` comme architecture cible possible, à
  réévaluer seulement quand un deuxième appareil réel rejoint le périmètre
  (cohérent avec le déclencheur déjà posé dans `docs/VISION_OP1.md`).

### Polyend Tracker — écosystème comparable, mais bien plus ouvert (deuxième vague, 13 août soir)

- **`polyend/tracker-lib`** : bibliothèque **officielle**, publiée par le
  fabricant lui-même, en **TypeScript**, pour lire/écrire/créer des fichiers
  de projet compatibles avec la famille Polyend Tracker. Contrairement à
  Teenage Engineering, Polyend fournit directement le SDK ouvert que la
  communauté EP-133 doit reconstruire par rétro-ingénierie (`ep-series-sysex`,
  `ep133-ppak`…).
- **Polyend Tracker Studio** (`simoianni.github.io/polyend-tracker-studio`) :
  éditeur web gratuit et ouvert de patterns/instruments — même catégorie de
  produit que notre Studio (compagnon web, gratuit, communautaire), utile
  comme point de comparaison UX plutôt que comme source technique.
- **`polyend/TrackerBetaTesting`** / **`TrackerIssues`** : suivi public des
  bugs et bêtas par le fabricant — signe d'un rapport développeur/communauté
  nettement plus ouvert que celui de Teenage Engineering aujourd'hui.
- **`patois/RETracker`** : framework de rétro-ingénierie via un firmware
  patché non officiel exposant un gestionnaire USB étendu — même catégorie
  de risque que `seajaysec/ep-unity` (modification de firmware). Référence
  de recherche uniquement, jamais à reproduire.
- Intérêt pour nous : confirme que la demande du fil OP Forums
  (« Opening up the EP series for third-party development ») a un précédent
  concret et positif dans une catégorie de produit très proche — un
  argument de plus pour le positionnement « Learning & Project OS »
  (Q-05) et pour continuer à documenter publiquement notre propre travail
  de rétro-ingénierie en lecture seule.
- Recommandation : `RÉFÉRENCER`. Pas d'action de code — observation
  stratégique et benchmark UX, à citer si l'occasion se présente d'appuyer
  une demande d'ouverture auprès de Teenage Engineering.

### neilbaldwin/KOII-tips-and-tricks — savoir utilisateur, pas une spécification

- Trouvé et confirmé (13 août, deuxième session) :
  <https://github.com/neilbaldwin/KOII-tips-and-tricks> (miroir Codeberg).
  Raccourcis, gestes et comportements observés par des utilisateurs — utile
  pour vérifier le vocabulaire et les attentes d'un musicien, jamais comme
  preuve d'un format SysEx sans capture instrumentée séparée.
- Recommandation : `RÉFÉRENCER` pour le vocabulaire UI/documentation.

## Étude parallèle convergente (`etude/codex/`, 13 août)

Une deuxième session a mené sa propre veille en parallèle, dans son propre
dossier (`etude/codex/`), sans coordination directe avec celle-ci. Comparée
et vérifiée avant d'en reprendre quoi que ce soit — voir les deux entrées
ci-dessus (`ep133-krate`, `gabriel-roth/knockout`) pour le résultat de cette
vérification. Deux apports méthodologiques de cette étude parallèle valent
la peine d'être cités ici, en complément des statuts déjà utilisés dans
`docs/REGISTRE_IDEES.md` (RETENU/EXPÉRIMENTER/etc.), pas en remplacement :

- **Niveaux de confiance par source** : A (observé directement dans le
  code d'un dépôt), B (corroboré par plusieurs projets ou un test
  documenté), C (hypothèse ou discussion sans reproduction locale),
  Interdit (action destructive ou ressource non autorisée). Une grille
  simple, utile pour qualifier une affirmation en une phrase.
- **Niveaux de risque matériel** : H0 (lecture/capture/export hors
  machine), H1 (MIDI ordinaire et fonctions officiellement exposées), H2
  (écriture SysEx avec backup et machine de test), H3 (firmware, DFU,
  cross-flash, ouverture du boîtier). Le Studio reste H0/H1 par défaut —
  cohérent avec nos propres règles déjà actées (lecture seule par défaut,
  DFU/firmware hors périmètre), formulé différemment.
- Cette étude parallèle a aussi couvert un terrain que la nôtre n'avait pas
  abordé : mods matériels et firmware (bouton de fader remplacé sur les
  premières séries, rumeur non vérifiée de cross-flash EP-133/EP-40 via un
  fil Reddit, DFU/récupération). Classé H3, explicitement hors périmètre
  produit des deux côtés — aucune action de code, gardé ici comme pointeur
  de veille uniquement.

## Ce qui ne change pas

Toutes les règles déjà actées restent valables : lecture seule par défaut,
aucune donnée machine redistribuée, aucun fichier `.syx` tiers envoyé tel
quel, aucune fonctionnalité DFU/firmware dans l'interface. Cette étude ne
propose aucune exception à ces règles.
