# Feuille de route — EP-133 KO II Studio

## Vision

Construire une suite locale en français autour du Teenage Engineering EP-133 :

1. cloner et comprendre les projets et sons de la machine ;
2. composer et arranger dans un éditeur complet raccordé à l'EP-133 ;
3. gérer patterns, scènes, Songs et banques de sons hors ligne ;
4. préparer des changements contrôlés avant leur retour vers l'appareil ;
5. apprendre le rythme avec le module pédagogique Rhythm Hero.

L'application doit rester utile lorsque l'EP-133 est déconnecté. Le matériel
apporte ses pads, ses sons et son séquenceur, mais ne doit pas être une condition
pour ouvrir, écouter ou modifier un projet.

## Principes non négociables

- Lecture seule par défaut lors d'un scan de la machine.
- Aucune écriture ou suppression sans cible précise, sauvegarde et confirmation.
- Ne jamais présenter un export expérimental comme garanti compatible.
- Une seule horloge pilote le son, le curseur, la boucle et le MIDI.
- Les données de projet restent ouvertes et documentées en JSON.
- Les valeurs binaires non confirmées sont préservées, jamais réinventées.
- Toute idée, même reportée ou écartée, reste tracée dans
  [REGISTRE_IDEES.md](REGISTRE_IDEES.md).
- Toute avancée FR/EN/ES est tracée dans
  [SUIVI_TRADUCTIONS.md](SUIVI_TRADUCTIONS.md).
- Les sons de la machine ne sont pas copiés ou redistribués sans droit explicite.
- Rhythm Hero reste un module séparé du Studio sur la page d'accueil.

## État consolidé — 11-12 août 2026

Mise à jour du 12 août — trois plans avancés dans l'ordre, chacun vérifié
par `npm run typecheck`/`build`/`test` et un vrai scénario Playwright ou
script isolé avant d'être committé :

- **Plan P0 clos** : Song Position qui suit la lecture, Annuler/Rétablir sur
  l'édition de pattern, dépendances pinnées, CI qualité, et l'audit du
  cycle Save→quitter→rouvrir a trouvé un vrai bug (voir
  [VALIDATION_SAVE_LOAD_STUDIO.md](VALIDATION_SAVE_LOAD_STUDIO.md)) : une
  frappe ONE simple redevenait une note MIDI fixe après un aller-retour
  Sauvegarder→Ouvrir — corrigé et couvert par un test de non-régression.
- **Plan P1 clos** : dix parcours pédagogiques (5 styles écrits en plus),
  rapport de progression par pad, conversion Projet → Exercice, édition de
  la vélocité d'un pas (Maj+molette), recherche/métadonnées dans
  « Ouvrir… », et parcours 7/30 jours avec répétition sur MISS élevé.
- **Plan P2 en cours** : item 2 fait (analyse WAV déterministe), item 5
  partiel (Time Machine — chronologie et comparaison ; en le vérifiant, un
  bug de migration a été trouvé et corrigé : un ancien manifeste sans les
  nouveaux champs par entrée aurait affiché « NaN son » au premier point
  suivant la mise à jour). Les items 1, 3, 4 et le reste de l'item 5
  (restauration) touchent à une écriture matérielle réelle et restent hors
  de portée du travail logiciel seul, consigne stricte de lecture seule sur
  la machine physique.
- **Bug audio réel corrigé** (signalé incidemment pendant la vérification
  du parcours 7/30 jours, trié le même jour — REGISTRE_IDEES.md Q-17) :
  le modèle programmé et les frappes live du joueur partageaient les mêmes
  instruments Tone.js, provoquant une erreur de planification quand le
  joueur tapait pile au bon moment — pas un cas rare, c'est le but du jeu.
  Corrigé en séparant les deux en instruments indépendants.
- **« Pad confondu » ajouté** au rapport par pad (REGISTRE_IDEES.md Q-07),
  limite explicitement notée le 12 août au matin et comblée le même jour :
  détecte les MISS proches dans le temps d'une cible non jouée sur un
  autre pad, signale le pad le plus souvent visé par erreur.

Mise à jour du 11 août : fusion complète des deux branches de travail dans
`main` (fiche personnage, bibliothèque perso intégrée à Sons & Transfert,
niveau 1 du catalogue Rhythm Hero écrit à la main, refonte Song/grille du
Studio). Croisement avec deux études externes apportées par l'utilisateur et
deux synthèses indépendantes (une par agent, l'une convergeant fortement avec
l'autre) — voir le détail des idées nouvelles dans
[REGISTRE_IDEES.md](REGISTRE_IDEES.md#qualité-logicielle-et-stratégie-produit),
la synthèse complète dans
[ANALYSE_GPT_EP133_KOII_STUDIO.md](ANALYSE_GPT_EP133_KOII_STUDIO.md) et le
rapport de session dans
[RAPPORT_SESSION_2026-08-11.md](RAPPORT_SESSION_2026-08-11.md). Le diagnostic
Web MIDI reste ouvert côté utilisateur : le test direct fonctionne, mais
« NON CONNECTÉ » persiste par moments — cause probable non confirmée,
autorisation MIDI du navigateur.

### Disponible

- Accueil modulaire : Rhythm Hero, Studio EP-133, Sons & Transfert, Fiche
  personnage, Test machine, Documentation.
- Jeu avec 39 styles, cinq difficultés, compte à rebours, score et Web MIDI ;
  niveau 1 de Boom-Bap, House, Rock, Reggae et Minimal écrit à la main.
- Éditeur du jeu à mesures extensibles et sauvegarde locale.
- Studio quatre groupes A–D, 12 pads par groupe et piano-roll KEYS.
- Lecture des sons par l'ordinateur ou par la sortie MIDI de l'EP-133.
- Lecture synchronisée, curseur, défilement, boucle et horloge MIDI.
- Export MIDI et description `ep.project.v1` JSON.
- Scan matériel en lecture seule : projet, pads, slots, noms, modes et notes
  racines. Le scan validé a trouvé 527 sons et 56,21 Mo sur la machine testée.
- Cache local de l'inventaire du projet 1, sans contenu audio.
- Fiche personnage : identité, plusieurs machines déclarées, bilan cumulé,
  CONNECTER/SCANNER/CLONER, dossier de travail et bibliothèque perso
  mémorisés entre deux visites (IndexedDB).
- Sons & Transfert : bibliothèque perso et banque machine côte à côte, même
  code visuel, glisser-déposer dans les deux sens, bouton d'écoute sur
  chaque slot, copie réelle des sons perso vers le dossier de travail.
- Édition de la vélocité d'un pas (Maj+molette dans la grille rythmique,
  1–127, retour visuel par opacité et infobulle) — couverte par
  Annuler/Rétablir comme toute autre édition de pattern.
- « Ouvrir… » du Studio : recherche par titre et métadonnées (BPM, nombre
  de patterns, date) sur les projets personnels, triés du plus récent au
  plus ancien.
- Parcours 7/30 jours dans la fiche personnage : rotation des dix styles
  dédiés, difficulté qui augmente à chaque tour complet, répétition
  automatique du jour précédent si son taux de MISS dépasse 25 %, bouton
  COMMENCER qui charge directement le style/niveau du jour dans le jeu.
- Fiche audio du WAV dans Sons & Transfert : poids, durée, fréquence
  source, canaux, profondeur et écrêtage détecté, affichée à l'écoute
  d'un son de la bibliothèque perso.
- Chronologie Time Machine dans le dialogue CLONER : chaque SCAN/CLONE
  ajoute un instantané daté avec comparaison au précédent (sons, mémoire,
  projet scanné) — pas encore de restauration.

### Expérimental ou incomplet

- Le JSON EP-133 doit encore être compilé et vérifié en `.ppak` sur une copie
  de projet de test.
- Le mode KEYS écrit les hauteurs MIDI, mais la durée (gate) et les
  articulations ne disposent pas encore de leurs éditeurs, et le
  piano-roll KEYS lui-même n'a pas encore d'édition de vélocité note à
  note (seule la grille rythmique en dispose, 12 août — voir
  REGISTRE_IDEES.md E-16). Le micro-timing (déplacement hors grille, au
  tick) et la multi-sélection avec nudge restent également à construire.
- Les modes ONE, KEYS et LEGATO lus sur la machine ne sont pas tous modifiables
  et persistés de bout en bout.
- Aucune écriture directe vers l'EP-133 n'existe encore (aucun protocole
  SysEx d'écriture dans le projet) ; SYNCHRONISER dans Sons & Transfert
  copie désormais réellement les sons perso choisis vers le dossier de
  travail local, mais rien n'est jamais envoyé à la machine elle-même.
- **Correction d'une inexactitude de ce document** : les 5 niveaux de
  Boom-Bap, House, Rock, Reggae et Minimal étaient déjà tous écrits à la
  main, contrairement à ce qu'affirmait cette ligne jusqu'au 12 août — seule
  la documentation était restée en retard sur le code. Funk, UK Garage,
  Electro, Drum'n'Bass et Latin/Afrobeat rejoignent le lot le 12 août : dix
  styles à 5 niveaux écrits à la main au total, la cible « dix parcours
  pédagogiques finis » du plan P0 est atteinte. Les 29 styles restants
  utilisent encore des partitions générées provisoires.
- Les tests automatisés restent limités à 3 scripts ciblés (moteur,
  transport, exports) — toujours aucun test d'intégration ni E2E committé,
  mais une CI qualité (typecheck + tests + build) tourne désormais sur
  chaque push/PR (11 août, `.github/workflows/ci.yml`).
- Les dépendances (`react`, `vite`, `tone`, `@vitejs/plugin-react`) sont
  pinnées en `^` depuis le 11 août (plus de `latest`), lockfile regénéré et
  revérifié avec `npm ci`.
- Annuler/Rétablir (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z) existe désormais pour
  l'édition d'un pattern (11 août) — pas encore pour les scènes/Song ni de
  vraie autosauvegarde de secours.
- La Song Position affichée avance désormais avec la lecture (11 août),
  mais reste basée sur le numéro de scène — deux positions consécutives de
  la même scène ne sont pas encore distinguées visuellement.

## Phase 1 — stabiliser avant d'ajouter

- [x] Découper `App.tsx` en pages et composants visuels isolés.
- [x] Définir un modèle canonique pour studio, groupes et notes, avec
  adaptateurs explicites pour les cibles de score du jeu.
- [x] Ajouter tests du score, des conversions MIDI et de l'extension automatique.
- [x] Ajouter une gestion centralisée du transport et nettoyer tous les timers.
- [ ] Tester manuellement Chrome/Chromium, écran large et petit écran.
- [ ] Mettre à jour systématiquement l'état du projet après chaque livraison.
- [x] Pinner les dépendances (`react`, `vite`, `tone`, `@vitejs/plugin-react` —
  plus de `latest`, versions en `^` figées sur ce qui était réellement
  installé), lockfile regénéré et vérifié avec `npm ci` (voir
  REGISTRE_IDEES.md Q-01).
- [x] CI qualité sur chaque push/pull request : typecheck, `npm test`,
  build (`.github/workflows/ci.yml`, voir REGISTRE_IDEES.md Q-02).

**Validation :** build reproductible, aucune note bloquée, navigation et boucle
stables, restauration correcte d'une session locale.

## Phase 2 — menu SAVE / LOAD et bibliothèque de partitions

Transformer `SAVE` en menu de fichiers :

- [x] Nouveau projet quatre groupes avec protection avant remplacement.
- [x] Sauvegarder et Sauvegarder sous.
- [x] Charger un projet local `ep.project.v1` depuis la bibliothèque.
- [x] Cycle Save→quitter→rouvrir audité (12 août) : un vrai bug trouvé et
  corrigé (note MIDI inventée sur les frappes ONE, voir
  VALIDATION_SAVE_LOAD_STUDIO.md), couvert par un test de non-régression.
  Reste hors périmètre de cet audit : téléchargement de fichier local et
  autosauvegarde de secours (juste en dessous).
- [ ] Renommer, dupliquer, archiver et supprimer avec confirmation (tout est
  opérationnel sauf l'archivage).
- [ ] Ouvrir et sauvegarder des projets `.pak/.ppak`.
- [ ] Importer et exporter du MIDI standard.
- [ ] Garder `ep.project.v1` comme représentation technique intermédiaire.
- [ ] Lister les exercices officiels du jeu dans la même bibliothèque, en
  lecture seule, avec action « Dupliquer pour modifier ».
- [ ] Miniatures, date de modification, BPM, longueur et groupes utilisés.
- [x] Historique Annuler/Rétablir du pattern actif (Ctrl/Cmd+Z, boutons
  ANNULER/RÉTABLIR) — rafales d'édition coalescées, 50 entrées max par
  pattern. Limite connue : scènes/Song/tempo/nom ne sont pas encore
  couverts, une prochaine étape si le besoin se confirme.
- [ ] Autosauvegarde de secours.

**Validation :** quitter, rouvrir une sauvegarde machine et retrouver une
composition identique sans machine connectée ; échanger ses notes en MIDI.

### Song mode et découpage du morceau

- [x] Afficher les repères machine `L.01`, `S.01`, `A01–D01`.
- [x] Calculer la longueur d'une position depuis le pattern le plus long.
- [ ] Gérer réellement les patterns A01–D99.
- [ ] Créer et éditer les scènes S.01–S.99.
- [ ] Ordonner les Song Positions L.01–L.99.
- [x] Faire suivre la Song Position active par le transport pendant la
  lecture d'un Song multi-positions (`editorActiveScene` avance en temps
  réel avec la scène qui sonne, vérifié par un vrai scénario Playwright sur
  la démo GROOVE — L.01 → L.03 observé pendant la lecture). Limite connue :
  le repère est basé sur le numéro de **scène**, donc deux positions
  consécutives qui pointent vers la même scène (ex. `[1, 1, 2, 3]`, L.01 et
  L.02) affichent la même étiquette — distinguer les positions par leur
  index plutôt que par leur scène reste à faire si nécessaire.
- [ ] Faire suivre la Song Position dans l'export.

## Phase 3 — deux banques de sons hors ligne

### Profil et miroir de machine

- [x] Profil local nommé avec choix 64/128 Mo.
- [x] Inventaire global en lecture seule des slots occupés et de leur taille.
- [x] Association explicite d'un dossier local de samples.
- [ ] Identifier automatiquement et durablement chaque machine.
- [x] Scanner les 9 projets et toutes les métadonnées sonores.
- [x] Copier les fichiers audio dans le dossier privé avec reprise et hash.
- [x] Moteur local de copie des 9 projets, PCM, métadonnées et hashes.
- [x] Relier la fenêtre web au moteur par un pont HTTP local.
- [x] Préparer la synchronisation incrémentale et l'historique des manifestes.
- [x] Valider un second passage incrémental depuis le bouton sur la machine.
- [ ] Installer et démarrer automatiquement le pont comme service utilisateur.
- [ ] Créer l'instantané initial immuable.
- [ ] Calculer un patch entre instantané et copie de travail.
- [ ] Détecter les conflits avant toute synchronisation.
- [x] Préparer visuellement les réaffectations son → pad et leur diff mémoire.
- [ ] Synchroniser les affectations après checkpoint, compilation et relecture.
- [x] Créer un manifeste local avec un premier instantané daté.
- [x] Time Machine : chronologie et comparaison (partiel, 12 août — voir
  REGISTRE_IDEES.md Q-16/F-16) : chaque SCAN/CLONE ajoute désormais un
  point daté à `history` avec le delta depuis le précédent (sons/Mo/
  projet), affiché dans le dialogue CLONER. Bug de migration trouvé et
  corrigé le même jour en revérifiant ce chantier : un manifeste laissé
  par le code d'avant ce correctif n'a que `{ createdAt, label }` par
  entrée d'historique — sans le garde-fou ajouté (`Number.isFinite`), le
  premier point suivant la mise à jour aurait affiché « NaN son ».
  Restauration locale d'un projet/sample isolé pas encore commencée —
  nécessiterait un stockage versionné réel des PCM sur disque, pas
  seulement des métadonnées.
- [ ] Time Machine : patch de restauration matérielle avec checkpoint.

### Banque ordinateur

- [x] Parcourir la bibliothèque personnelle (dossier réglé depuis la Fiche
  personnage, navigation en fil d'Ariane, un niveau à la fois) et l'écouter
  directement dans Sons & Transfert, à côté de la banque machine.
- [x] Glisser un son personnel sur un pad ou directement sur un slot de la
  banque machine ; copier les sons choisis vers le dossier de travail
  (`a-importer/`) — une vraie préparation sur disque, jamais une écriture
  machine.
- [ ] Sons libres ou créés par l'utilisateur, versionnés par identifiant et hash.
- [ ] Tags, favoris et recherche avancée (recherche par nom déjà disponible).
- [ ] Kit de secours permettant de jouer tous les projets hors ligne.

### Banque miroir EP-133

- Inventaire des 999 slots et de la mémoire disponible.
- Noms, métadonnées et affectations des pads issus du scan.
- Audio téléchargé uniquement à la demande et conservé localement avec accord
  de l'utilisateur ; aucune banque constructeur distribuée dans Git.
- Indication claire : métadonnées seules, audio disponible localement ou son
  manquant.
- [x] Sélection séparée du dossier de samples depuis le menu FICHIER.
- [x] Lecture PCM locale des pads et de la partition lorsque la machine est
  débranchée.
- [ ] Réouverture automatique du dossier autorisé via le pont local.

### Résolution des sons

Chaque pad référence un son logique et deux sources possibles : son ordinateur
et slot EP-133. Le projet peut donc être écouté hors ligne puis rejoué avec le
son matériel quand la machine revient.

**Validation :** un projet scanné reste audible après déconnexion, sans intégrer
de fichiers audio propriétaires au dépôt.

## Phase 4 — éditeur et préparateur de sons

- [ ] Import WAV/AIFF, puis MP3/FLAC/OGG si le décodeur retenu le permet.
- [x] Analyse déterministe du WAV (12 août, P2 — voir REGISTRE_IDEES.md
  Q-15) : poids, durée, fréquence source (lue dans l'en-tête, jamais
  rééchantillonnée par le navigateur), canaux, profondeur et détection
  d'écrêtage, affichée à l'écoute d'un son de la bibliothèque perso dans
  Sons & Transfert. Pas encore de forme d'onde ni de conversion — une
  fiche de lecture avant tout traitement.
- [ ] Forme d'onde, trim, normalisation, fondu et détection du silence.
- [ ] Mono/stéréo, fréquence, hauteur racine, BPM, ONE/KEYS/LEGATO.
- [ ] Conversion native cible PCM 16 bits à 46 875 Hz et dither TPDF lorsque
  la réduction de profondeur le nécessite.
- [ ] Pré-écoute avant/après conversion.
- [ ] Conversion contrôlée vers le format accepté par l'EP-133.
- [ ] Estimation exacte du poids et jauge de mémoire avant transfert.
- [ ] Choix prioritaire d'un slot libre.
- [ ] Paquet de sons préparé, manifeste et contrôles d'intégrité.
- [ ] Analyse des doublons et sons orphelins en mode proposition uniquement.
- [ ] Sauvegarde du slot remplacé, confirmation explicite, écriture sérialisée
  puis lecture de vérification.

**Validation :** aucun transfert ne démarre si l'espace est insuffisant ou si
la cible occupée n'a pas été explicitement confirmée.

## Phase 5 — projets EP-133 complets

- [ ] Compiler le JSON avec `kmorrill/ep-series-sysex` (MIT).
- [ ] Générer `.ppak` hors ligne avec rapport de validation.
- [ ] Charger une sauvegarde existante comme base afin de préserver les champs
  inconnus et réglages non édités.
- [ ] Gérer patterns, scènes, song mode, vélocité, durée et automation.
- [ ] Ajouter l'historique Annuler/Rétablir avant les gestes destructifs.
- [ ] Piano-roll : sélection multiple, déplacement, redimensionnement du gate,
  quantification et édition de vélocité.
- [ ] Navigation longue partition : pan molette, zoom centré et défilement
  horizontal, avec équivalents clavier accessibles.
- [ ] Raccourcis limités à la grille ayant le focus : lecture, duplication,
  déplacement, transposition et résolution de grille.
- [ ] Associer les dépendances sonores et détecter les slots absents.
- [ ] Écrire uniquement dans un projet brouillon choisi par l'utilisateur.
- [ ] Checkpoint avant écriture, relecture binaire et restauration possible.

**Validation :** projet de test exporté, chargé, joué et relu sur le firmware de
la machine sans toucher aux autres projets.

## Phase 6 — contenu pédagogique

- [x] 5 niveaux écrits à la main pour dix styles : Boom-Bap, House, Rock,
  Reggae, Minimal (déjà fait), puis Funk, UK Garage, Electro, Drum'n'Bass
  et Latin/Afrobeat (12 août — cible « dix parcours pédagogiques finis »
  du plan P0 atteinte). Les 29 styles restants gardent la génération
  procédurale en attendant leur tour.
- [x] Rapport de progression par pad après une session (12 août, P1 —
  voir REGISTRE_IDEES.md Q-07) : pads triés du plus fauté au moins fauté,
  écart moyen signé (avance/retard) par pad, conseil de tempo simple
  (ralentir si trop de MISS, accélérer si très propre). « Pad confondu »
  fait plus tard le même jour : sur un MISS, `scoreHit` compare aux
  cibles non jouées des AUTRES pads dans la fenêtre GOOD, `buildPadReport`
  remonte le pad le plus souvent visé par erreur (à partir de 2
  occurrences, sinon bruit) — affiché « ↷ SOUVENT CONFONDU AVEC … ».
- [x] Historique local des scores et progression (partiel, 12 août) : un
  journal daté par séance (`practicePlan.ts`, `PracticeLogEntry`) existe
  désormais pour les dix styles dédiés, support du parcours 7/30 jours —
  pas encore une vue « historique » dédiée et navigable en soi, seulement
  exploitée par le parcours.
- [ ] Conseils ciblés sur timing, main, doigt et pad.
- [x] Parcours 7 jours et 30 jours avec répétition des difficultés (12
  août, P1 — voir REGISTRE_IDEES.md Q-14) : rotation des dix styles
  dédiés, répétition automatique si MISS > 25 % la veille, section
  PARCOURS dans la fiche personnage.
- [x] Envoyer une composition du Studio comme exercice du jeu (12 août, P1
  — FICHIER › Envoyer le pattern vers Rhythm Hero). Réutilise
  editorExercise()/saveEditorExercise déjà en place pour le SAVE du jeu,
  pas un nouveau convertisseur : le pattern actif (groupe/numéro
  sélectionnés) devient un exercice USER immédiatement jouable, sans
  quitter le Studio. Limite assumée : un seul pattern à la fois (pas
  encore toute une scène/Song), et pas de sélection de mesures.
- [ ] Dupliquer un exercice officiel vers USER sans modifier l'original.

## Phase 7 — extension OP-1

Le futur outil OP-1 reprendra la page d'accueil et les briques génériques, mais
gardera son protocole, ses moteurs et ses formats dans un module indépendant.
Voir [VISION_OP1.md](VISION_OP1.md).

## Fonctions de DAW reportées

Ces fonctions sont utiles, mais ne doivent pas retarder la solidité : console de
mixage avancée, plugins, mastering, automation complexe, time-stretch avancé,
arrangement audio multipiste et collaboration en ligne.

Les exports DAWproject et REAPER seront évalués avant les formats propriétaires.
Le projet `phones24/ep133-export-to-daw` constitue une preuve de faisabilité,
mais sa licence AGPL-3.0 impose une frontière juridique explicite. Voir
[ANALYSE_ETUDE_CAHIER_CHARGES.md](ANALYSE_ETUDE_CAHIER_CHARGES.md).
