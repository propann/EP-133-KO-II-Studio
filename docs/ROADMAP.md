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

## Stratégie de livraison

Le Studio est développé d'abord comme un produit utile et fiable. Le code
reste compatible avec un futur déploiement, mais aucun système de comptes,
paiement, abonnement ou stockage cloud n'est ajouté avant que les fonctions
principales soient stabilisées et validées.

La piste « service hébergé ou payant » sera réévaluée en fin de cycle produit,
à partir d'un outil réellement utilisé, d'un périmètre clair et d'un modèle
économique explicite. Cette séparation évite de mélanger infrastructure
commerciale et validation du workflow EP-133.

## État consolidé — 11-13 août 2026

Mise à jour du 13 août — étude de l'écosystème externe et des bibliothèques
techniques (nouveau dossier [`etude/`](../etude/00_INDEX.md)), suivie d'une
première vague d'intégration d'outillage qui simplifie des chantiers déjà
actés mais jamais commencés : `vitest` (formalise Q-03), `vite-plugin-pwa`
(réalise X-12), et un premier domaine d'état (langue FR/EN/ES) sorti
d'`App.tsx` vers un magasin `zustand` pilote. Détail dans
[REGISTRE_IDEES.md](REGISTRE_IDEES.md#écosystème-externe-et-bibliothèques-étude-du-13-août-2026)
(R-04 à R-10) et [SUIVI_IMPLEMENTATION.md](SUIVI_IMPLEMENTATION.md).
`npm run typecheck`, `npm run build` et `npm test` vérifiés à froid après
correction de deux vrais problèmes trouvés au passage : un import de type
oublié dans `DocumentationPage.tsx`, et un `node_modules`/`dist` en partie
appartenant à `root` dans le bac à sable de cette session (corrigé sans
toucher aux fichiers root, par renommage puis réinstallation propre) — voir
`docs/SUIVI_IMPLEMENTATION.md` pour le détail complet.

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
[RAPPORT_SESSION_2026-08-11.md](RAPPORT_SESSION_2026-08-11.md).

**Diagnostic Web MIDI clos le 12 août** avec la vraie machine branchée (voir
[CONNEXION_ET_CALIBRATION_MIDI.md](CONNEXION_ET_CALIBRATION_MIDI.md#dépannage--non-connecté-qui-persiste))
: la connexion réussit et reste fiable dès que Chrome accorde les deux
niveaux d'autorisation (`midi` et `midi-sysex` — un seul des deux ne suffit
pas). Pas un bug de l'app ; « NON CONNECTÉ » persistant signale une
autorisation SysEx refusée ou incomplète côté navigateur, procédure de
dépannage documentée.

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
- Détection des dépendances manquantes à l'ouverture d'un projet : si les
  affectations son → pad enregistrées ne correspondent plus à la banque
  actuellement scannée, un bandeau liste les pads concernés (testé avec
  les 32 vrais pads de la machine réellement branchée le 12 août).
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

- **PWA installable** (13 août, X-12) : `vite-plugin-pwa` configuré,
  icônes originales créées. Build vérifié (`dist/manifest.webmanifest`,
  `dist/sw.js`, `dist/registerSW.js` bien générés) ; reste à confirmer
  manuellement l'installation réelle dans Chrome/Chromium et le
  fonctionnement hors ligne, non testé ce 13 août.
- **Premier domaine d'état sorti d'`App.tsx`** (13 août, R-08) : la langue
  FR/EN/ES vit désormais dans un magasin `zustand`
  (`src/core/store/languageStore.ts`), `DocumentationPage` le lit
  directement sans prop. Un seul domaine sur un très grand nombre d'états
  encore locaux à `App.tsx` — pas une découpe complète, une preuve de
  méthode pour la suite. Typecheck et build vérifiés.
- Le JSON EP-133 doit encore être compilé et vérifié en `.ppak` sur une copie
  de projet de test.
- Le mode KEYS écrit les hauteurs MIDI ; les articulations ne disposent pas
  encore de leur éditeur. L'édition de vélocité (Maj+molette) couvre la
  grille rythmique et le piano-roll KEYS note à note (12 août — voir
  REGISTRE_IDEES.md E-16). L'édition du gate/durée (Alt+molette, E-05), la
  multi-sélection (Ctrl/Cmd+clic, E-15) et le nudge temporel (flèches
  gauche/droite, E-18) couvrent la grille rythmique, le même jour. Restent :
  micro-timing hors grille (au tick), transposition verticale (E-19),
  sélection par glisser-rectangle, gate sur le piano-roll KEYS et les
  sections commitées.
- Les modes ONE, KEYS et LEGATO lus sur la machine ne sont pas tous modifiables
  et persistés de bout en bout.
- Aucune écriture de sample, pattern ou archive vers l'EP-133 n'existe encore.
  Une exception strictement limitée est désormais validée : la sélection A–D
  écrit la métadonnée `active` du groupe via FILE et la relit immédiatement.
  SYNCHRONISER dans Sons & Transfert copie les sons perso choisis vers le
  dossier de travail local ; aucun contenu audio ou projet n'est envoyé à la
  machine.
- **Correction d'une inexactitude de ce document** : les 5 niveaux de
  Boom-Bap, House, Rock, Reggae et Minimal étaient déjà tous écrits à la
  main, contrairement à ce qu'affirmait cette ligne jusqu'au 12 août — seule
  la documentation était restée en retard sur le code. Funk, UK Garage,
  Electro, Drum'n'Bass et Latin/Afrobeat rejoignent le lot le 12 août : dix
  styles à 5 niveaux écrits à la main au total, la cible « dix parcours
  pédagogiques finis » du plan P0 est atteinte. Les 29 styles restants
  utilisent encore des partitions générées provisoires.
- Les tests automatisés restent fondés sur 4 scripts ciblés (moteur,
  transport, exports, analyse WAV) — aucun test d'intégration React n'existe
  encore, mais une CI qualité (typecheck + tests + build) tourne désormais
  sur chaque push/PR (11 août, `.github/workflows/ci.yml`). Depuis le
  13 août, `vitest` les enveloppe sans dupliquer leur logique
  (`npm run test:unit`, voir REGISTRE_IDEES.md R-04) — et un premier vrai
  test **E2E** existe désormais (`e2e/midi-connection.spec.ts`, Playwright,
  `npm run test:e2e`, câblé en CI après le build) : Web MIDI simulé via
  `page.addInitScript()`, deux scénarios vérifiés en exécution réelle
  (EP-133 détecté vs absent), voir REGISTRE_IDEES.md R-16. La pyramide de
  tests visée par Q-03 a maintenant ses trois niveaux amorcés ; reste à
  l'élargir au-delà de l'écran d'accueil (Studio, Sons & Transfert).
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

- [x] Découper `App.tsx` en pages et composants visuels isolés — le
  découpage des *vues* (`src/pages/`, `src/components/`, ~1 720 lignes
  extraites) est fait ; celui de l'*état* ne fait que commencer
  (`App.tsx` reste à environ 1 550 lignes et 60 `useState`, voir R-08 dans
  REGISTRE_IDEES.md et PROJECT_CONTEXT.md § Priorités).
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
- [x] Renommer, dupliquer, archiver et supprimer avec confirmation. L'archivage
  retire le projet de la liste active sans supprimer son document local.
- [x] Importer et ouvrir en lecture seule les projets `.pak/.ppak` ; la
  réécriture/compilation d'archive reste séparée et non promise.
- [x] Importer et exporter du MIDI standard (import multi-fichiers vers la
  bibliothèque locale, export du pattern actif ; formats MIDI 0/1 lus).
- [x] Garder `ep.project.v1` comme représentation technique intermédiaire —
  décision adoptée le 9 août (`docs/DECISION_FORMATS_PROJET.md`) et déjà
  respectée dans tout le code (`exporters.ts`, `importers.ts`,
  `studioLibrary.ts`) ; cette case était restée décochée par erreur alors
  que ce n'est pas une tâche ponctuelle mais un principe déjà en vigueur —
  à garder vrai à chaque nouvelle fonctionnalité, pas à recocher un jour.
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
- [ ] Installer et démarrer automatiquement le pont comme service utilisateur
  — **à reconsidérer avant de le faire** : `etude/02_BIBLIOTHEQUES_TECHNIQUES.md`
  (13 août, REGISTRE_IDEES.md R-09) propose de porter le moteur de clonage
  directement en TypeScript navigateur (Web MIDI + File System Access API en
  écriture, éventuellement `comlink` pour le faire tourner hors du fil
  principal), ce qui supprimerait le pont Python/venv entièrement plutôt que
  de finir de l'installer comme service. Étudier cette option en premier.
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
  Sons & Transfert.
- [x] Forme d'onde et trim non destructif (13 août — voir
  REGISTRE_IDEES.md A-09/A-10, R-06) : panneau `WaveformTrim`
  (`src/components/shared/WaveformTrim.tsx`) dans la bibliothèque perso de
  Sons & Transfert, région de sélection ajustable par glisser sur la forme
  d'onde. Les crêtes affichées viennent de `computeWaveformPeaks`
  (`src/core/audio/wavAnalysis.ts`, testé), lecture directe des octets PCM —
  même précaution que l'analyse déterministe, jamais le décodeur intégré de
  `wavesurfer.js`. La sélection ne fait encore que s'afficher (`TRIM x,xxS →
  y,yyS`) : aucun pipeline de conversion ne la consomme pour l'instant.
  Vérifié visuellement par l'utilisateur dans Chrome : forme d'onde,
  région glissable et lecture fonctionnent.
- [x] Détection du silence + gain de normalisation Peak suggéré (13 août,
  voir REGISTRE_IDEES.md A-06/A-08) : bouton `AUTO-TRIM SILENCE` et ligne
  `CRÊTE … · GAIN SUGGÉRÉ …` dans `WaveformTrim`. Le gain reste une
  suggestion affichée, pas encore appliqué au signal.
- [x] **Fondu (fade in/out)** (13 août) : rampe linéaire appliquée après
  resampling (durées en secondes exactes quelle que soit la cible LO/MID/HI),
  plafonnée à la moitié des trames de chaque côté pour ne jamais réduire un
  fichier très court au silence total. UI simple — deux champs de durée en
  ms dans `WaveformTrim`, pas encore de poignées à glisser sur la forme
  d'onde (amélioration possible plus tard, pas nécessaire pour livrer la
  fonction).
- [x] **Conversion native vers la fréquence cible EP-133 avec dither TPDF**
  (13 août, voir REGISTRE_IDEES.md A-03/A-04/R-07) :
  `src/core/audio/wavConvert.ts`, resampling par `@alexanderolsen/libsamplerate-js`
  (qualité maximale) plutôt qu'un ré-échantillonnage linéaire maison, encodage
  PCM 16 bits avec dither TPDF systématique. Cible explicite LO/MID/HI
  (26 250/32 000/46 875 Hz, firmware 2.5) — plus jamais une fréquence fixe
  supposée. Mono/stéréo : repli par moyenne seulement, pas encore de choix
  gauche/droite (A-05 partiel).
- [x] **Hauteur racine, BPM et mode ONE/KEYS/LEGATO** (13 août) : section
  « MÉTADONNÉES DE PRÉPARATION » dans `WaveformTrim` — sélecteur
  ONE/KEYS/LEGATO (réutilise le type `EditorPadMode` déjà validé sur
  matériel réel, pas une nouvelle notion), hauteur racine 0–127 avec nom de
  note affiché (`midiNoteName`, même source de vérité que le reste du
  projet), BPM optionnel (`null` = inconnu, jamais deviné automatiquement —
  aucune détection de tempo). **Volontairement pas encore écrit dans un
  en-tête RIFF réel** : le format exact du bloc `LIST/INFO/ITNG`
  propriétaire n'a jamais été recoupé avec une vraie machine par ce
  projet (voir `docs/REFERENCE_SYSEX_EP133.md`) — écrire un mauvais layout
  serait pire que ne rien écrire. Reste une préparation en mémoire, comme
  le trim et le fondu, en attendant un futur pipeline d'export validé sur
  matériel.
- [x] **Pré-écoute avant/après conversion** (13 août) : le bouton `▶ ÉCOUTER`
  de `WaveformTrim` reste l'original, un second lecteur `<audio controls>`
  apparaît une fois la conversion lancée pour comparer le résultat.
- [x] **Conversion contrôlée vers le format accepté par l'EP-133** (13 août) :
  trois boutons LO/MID/HI dans `WaveformTrim`, appliqués uniquement à la
  sélection de trim en cours — jamais tout le fichier par défaut. Module de
  conversion (~2 Mo, WASM) chargé à la demande au premier clic
  (`import()` dynamique), pas au chargement de la page — bundle principal
  inchangé (+3 Ko), chunk séparé confirmé au build.
- [x] **Estimation exacte du poids avant transfert** (13 août) : chaque
  bouton LO/MID/HI de `WaveformTrim` affiche le poids exact du WAV que
  produirait la conversion (`estimateEp133ConversionBytes`,
  `src/core/audio/ep133Targets.ts`), recalculé en direct pendant l'ajustement
  du trim — sans lancer de resampling réel, juste de l'arithmétique, vérifiée
  égale à un vrai résultat de conversion par un test dédié.
- [x] **Jauge de mémoire avant transfert** (13 août) : chaque bouton
  LO/MID/HI compare son poids estimé à l'espace restant sur la machine
  (`estimateEp133MemoryFit`, `capacityMb` + `soundIndex.usedBytes` déjà
  connus dans `SoundsPage`) — « TIENT · X MO RESTANTS » ou « NE TIENT PAS ·
  DÉPASSE DE X KO ». Ne s'affiche que si la machine a déjà été scannée une
  fois ; sinon le poids reste affiché seul, jamais un espace supposé
  disponible.
- [ ] Choix prioritaire d'un slot libre.
- [ ] Paquet de sons préparé, manifeste et contrôles d'intégrité.
- [ ] Analyse des doublons et sons orphelins en mode proposition uniquement.
- [ ] Sauvegarde du slot remplacé, confirmation explicite, écriture sérialisée
  puis lecture de vérification.

**Validation :** aucun transfert ne démarre si l'espace est insuffisant ou si
la cible occupée n'a pas été explicitement confirmée.

## Phase 5 — projets EP-133 complets

> Avant de commencer cette phase, lire
> [`etude/01_ECOSYSTEME_EP133.md`](../etude/01_ECOSYSTEME_EP133.md#kmorrillep-series-sysex)
> (13 août 2026) : `kmorrill/ep-series-sysex` propose désormais une écriture
> réelle vers l'appareil avec relecture et vérification octet par octet,
> vérifiée sur firmware 2.5.1 — un socle nettement plus avancé que ce que
> cette phase supposait à sa rédaction initiale.

- [x] Compiler le JSON avec `kmorrill/ep-series-sysex` (MIT) — 13 août,
  `tools/send_project_to_machine.py`, `compile_project()` réel, vérifié
  écrit et relu sur le firmware (voir Validation ci-dessous).
- [ ] Générer `.ppak` hors ligne avec rapport de validation (le script du
  13 août écrit directement le TAR sur la machine via `FileClient`, pas
  encore le conteneur `.ppak`/ZIP autonome — `build_ppak()` existe dans la
  bibliothèque, pas encore branché).
- [x] Charger une sauvegarde existante comme base afin de préserver les champs
  inconnus et réglages non édités — 13 août, `compile_project(doc,
  base_archive=<TAR relu en direct>)`, vérifié réel (P09 relu avant
  compilation, membres non décrits préservés).
- [ ] Gérer patterns, scènes, song mode, vélocité, durée et automation
  (seul un pattern à un seul événement a été écrit pour l'instant — pas
  scènes/Song/automation).
- [ ] Ajouter l'historique Annuler/Rétablir avant les gestes destructifs.
- [ ] Piano-roll : sélection multiple, déplacement, redimensionnement du gate,
  quantification et édition de vélocité.
- [ ] Navigation longue partition : pan molette, zoom centré et défilement
  horizontal, avec équivalents clavier accessibles.
- [ ] Raccourcis limités à la grille ayant le focus : lecture, duplication,
  déplacement, transposition et résolution de grille.
- [ ] Associer les dépendances sonores et détecter les slots absents.
- [ ] Écrire uniquement dans un projet brouillon choisi par l'utilisateur
  (fait manuellement le 13 août — slot P09 choisi explicitement par
  l'utilisateur comme sacrifiable ; pas encore un choix guidé depuis
  l'app web, script CLI seulement).
- [x] Checkpoint avant écriture, relecture binaire et restauration
  possible — 13 août, `tools/send_project_to_machine.py` : checkpoint
  disque avant chaque écriture, comparaison octet à octet post-écriture
  avant toute activation, commande `restore` dédiée (pas encore testée
  en conditions réelles, seulement la voie `write` l'a été).

**Validation :** projet de test exporté, chargé, joué et relu sur le firmware de
la machine sans toucher aux autres projets.

**Premier aller-retour réel réussi le 13 août 2026** (détail complet dans
`docs/SUIVI_IMPLEMENTATION.md`) : un pattern minimal (1 pad, 1 note) écrit
sur le slot P09 (vide, choisi par l'utilisateur), relu octet à octet
identique, activé sur le firmware — **et confirmé visuellement par
l'utilisateur directement sur la machine**. Reste : un vrai projet Studio
complet (pas seulement une note de test), les scènes/Song, et le chemin
`.ppak` autonome.

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
