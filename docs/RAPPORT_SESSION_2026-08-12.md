# Rapport de session — 12 août 2026

## Résumé

Suite directe de la session du 11 août
([RAPPORT_SESSION_2026-08-11.md](RAPPORT_SESSION_2026-08-11.md)) : deux
études externes apportées par l'utilisateur (audit technique et étude
concurrentielle, format .docx, lues par extraction XML directe sans
dépendance externe) et une synthèse indépendante produite en parallèle par
l'agent Studio
([ANALYSE_GPT_EP133_KOII_STUDIO.md](ANALYSE_GPT_EP133_KOII_STUDIO.md)) ont
été croisées avec l'état réel du dépôt pour reconstruire un plan P0/P1/P2/P3
partagé (voir [ROADMAP.md](ROADMAP.md) et
[REGISTRE_IDEES.md](REGISTRE_IDEES.md#qualité-logicielle-et-stratégie-produit)).
Les deux analyses indépendantes ont abouti au même ordre de priorités —
recoupement qui a servi de base au travail ci-dessous plutôt qu'un avis
isolé.

Plusieurs commits sur `main` (fusion directe, fast-forward à chaque fois — aucune
divergence à réconcilier), chacun vérifié par `npm run typecheck` +
`npm run build` + `npm test`, et par un vrai scénario Playwright ou un
script isolé quand le sujet le permettait — jamais une simple relecture de
code présentée comme une vérification.

## Plan P0 — cinq chantiers exécutés dans l'ordre convenu

### 1. Song Position qui suit la lecture

`toggleEditorPlayback` programmait déjà l'audio/MIDI de tout le Song en
séquence (concaténation des scènes avec un décalage de battements cumulé),
mais `editorActiveScene` — seule source du repère « SONG POSITION » affiché
— restait figé sur la scène de départ pendant toute la lecture. Corrigé en
réutilisant les mêmes décalages déjà calculés pour l'audio, suivis dans la
boucle `requestAnimationFrame` existante.

Vérifié en ouvrant le projet démo GROOVE (`song: [1,1,2,3]`, 3 scènes),
lecture lancée, lecture du repère toutes les 500 ms pendant 10 s :
progression **L.01 → L.03** confirmée en direct.

Limite documentée plutôt que cachée : le repère suit le numéro de scène,
donc deux positions consécutives pointant vers la même scène (L.01/L.02
dans cet exemple) affichent la même étiquette.

### 2. Annuler/Rétablir pour l'édition de pattern

Portée volontairement limitée à l'édition d'un pattern (le geste le plus
fréquent et le plus risqué à la souris) — pas encore les scènes, le Song,
le tempo ou le nom. Historique par pattern (clé `groupe:numéro`), une
entrée par rafale d'édition coalescée après 500 ms de silence. Ctrl/Cmd+Z
et Ctrl/Cmd+Shift+Z en plus des boutons ANNULER/RÉTABLIR de la barre
d'outils.

**Bug réel trouvé et corrigé avant de committer** : le garde « ne pas
enregistrer un changement de pattern comme une édition » était un booléen
consommé une seule fois, piégé par le double appel d'effet de StrictMode
au montage (React rejoue exprès les effets une fois en développement pour
détecter ce genre de non-idempotence — et l'a détecté). Sans le correctif,
ANNULER apparaissait actif dès l'ouverture du Studio, avant toute édition.
Remplacé par une comparaison par identité de référence, naturellement
idempotente.

Vérifié par de vrais scénarios Playwright : désactivé à l'ouverture ; deux
clics espacés de 700 ms (> 500 ms de debounce) produisent deux entrées
distinctes ; trois clics rapprochés (100 ms d'écart) produisent une seule
entrée annulée d'un coup ; Rétablir restaure exactement l'état annulé ;
raccourci clavier vérifié en plus des boutons.

### 3. Dépendances pinnées et CI qualité

Le chantier le plus rapide et le moins risqué des cinq — aucune logique
applicative touchée. `react`, `react-dom`, `vite`, `@vitejs/plugin-react`,
`tone`, `typescript`, `@types/react`, `@types/react-dom` passent de
`latest` à `^` figé sur ce qui était réellement installé.
`package-lock.json` regénéré depuis zéro (suppression et réinstallation
complète dans un worktree isolé, jamais dans le dossier partagé) puis
revérifié avec `npm ci` à froid.

`.github/workflows/ci.yml` : `npm ci`, `npm run typecheck` (nouveau script
dédié), `npm test`, `npm run build`, sur chaque push `main` et chaque pull
request — distinct de `deploy-pages.yml` qui construit et publie sans
aucune vérification avant.

### 4. Audit du cycle Save→quitter→rouvrir

Consigne explicite de l'utilisateur : « fait l'audit et code ensuite ».
L'audit a trouvé un vrai bug avant qu'aucune ligne de correction ne soit
écrite — voir le détail complet dans
[VALIDATION_SAVE_LOAD_STUDIO.md](VALIDATION_SAVE_LOAD_STUDIO.md).

En résumé : `serializePattern` (export vers `ep.project.v1`) écrivait
`note: target.note ?? 60` pour chaque frappe, y compris une frappe ONE
simple (pad-trigger, sans hauteur). Confirmé avec un script isolé avant
toute correction : `note: undefined` en entrée → `note: 60` dans le JSON
exporté → `note: 60` après réimport. Conséquence réelle : dès la
**deuxième** lecture d'un projet sauvegardé (jamais la première),
`toggleEditorPlayback` envoie `midi.sendNote(60, …)` au lieu de
`midi.sendPad(…)` — mauvais message MIDI vers la machine — et la lecture
PCM locale transpose audiblement le son si le `rootNote` du pad diffère
de 60.

Corrigé : `note` n'est écrit que si la frappe en porte vraiment une.
Rétrocompatible avec les projets déjà sauvegardés. Deux assertions
ajoutées à `tools/check-project-exports.mjs`, confirmées défaillantes sur
l'ancien code puis vertes après le correctif — la régression ne peut plus
revenir sans qu'un test casse.

### 5. Dix parcours pédagogiques finis

Dernier chantier du plan P0. En relisant `src/core/engine/patterns.ts`
avant d'écrire quoi que ce soit, découverte que ce rapport (et
`docs/ROADMAP.md`) affirmaient à tort que seul le niveau 1 de Boom-Bap,
House, Rock, Reggae et Minimal était écrit à la main — en réalité les 5
niveaux des 5 styles existaient déjà (commit `4aa8401`, antérieur à cette
session). Seule la documentation était restée en retard sur le code ;
corrigée dans `ROADMAP.md`.

Le vrai travail restant était donc d'ajouter 5 **nouveaux** styles à 5
niveaux chacun pour atteindre la cible « dix parcours pédagogiques finis »
recommandée par les deux audits externes et l'analyse GPT : **Funk/Boogie,
UK Garage, Electro/Glitch, Drum'n'Bass et Latin/Afrobeat**. Choisis parmi
les 34 styles procéduraux restants parce qu'ils avaient déjà un traitement
spécial dans `createGenericExercise` (signe qu'ils étaient pressentis) et
qu'ils ont tous une fiche dédiée dans
`handbook/EP133_ATLAS_FINGER_DRUMMING.md` (§5, §8, §9, §7, §10).

Même gabarit exact que les 5 styles existants : niveau 3 proche du motif
de référence de l'atlas (même convention que House), niveaux 1-2
simplifiés (kick + snare, puis hi-hat), niveaux 4-5 densifiés avec un fill
en mesure 6 gradué par palier de difficulté — propre à chaque style
(ghost kick pour Funk, rebond de kick pour Garage, glitch rare pour
Electro, roulement de perc pour Drum'n'Bass, cascade de congas pour
Afrobeat), pas un fill générique recopié cinq fois.

Vérifié par un vrai scénario Playwright, pas par relecture de code
seule : les 5 styles sélectionnés un par un dans le sélecteur du jeu,
niveau glissé de 1 à 5 via le contrôle de difficulté (glisser-déposer réel
simulé à la souris, pas un raccourci de test), nombre de pas affichés
confirmé strictement croissant à chaque style (funk 8→50, garage 8→40,
electro 8→44, dnb 8→46, afro 8→52) ; aucune erreur console ; capture
d'écran confirmant un rendu propre (pads colorés par catégorie, BPM du
catalogue affiché correctement pour chaque style).

## Plan P1 — premier chantier : rapport de progression par pad

Le plan P0 étant clos, premier chantier du P1 (priorité 1 des deux audits
et de l'analyse GPT indépendante : « rapport après exercice — avance/
retard, pad fautif, régularité et tempo conseillé »).

Nouveau module pur `src/core/engine/report.ts` (`buildPadReport`,
`adviseTempo`), testé directement par `tools/check-engine.mjs` (pas
seulement branché puis regardé) : regroupe les frappes d'une session par
pad, trie du plus fauté au moins fauté, calcule un écart moyen **signé**
par pad (avance/retard, pas juste une magnitude comme l'ancien indicateur
ÉCART agrégé), et propose un conseil de tempo simple (ralentir si plus de
25 % de MISS, accélérer si plus de 70 % de PERFECT et moins de 5 % de
MISS, silence sinon plutôt qu'un pourcentage inventé). Affiché dans
`PerformancePanel`, sous les statistiques agrégées existantes.

**Bug réel trouvé et corrigé en vérifiant ce rapport avec un vrai scénario
Playwright** (jouer une session, cliquer des pads, lire le contenu du
panneau ANALYSE) — pas par relecture de code : `onHit` appelait
`setPlayerNotes`/`setFlashedPad` **à l'intérieur** de l'updater fonctionnel
de `setScore`. Piégé par le même mécanisme que le bug Annuler/Rétablir du
11 août — React StrictMode rejoue exprès un updater fonctionnel une
deuxième fois en développement pour détecter ce genre d'impureté ; le
score final restait juste (seul le second appel est retenu), mais
`playerNotes` et `flashedPad` doublaient à **chaque** frappe, faussant
silencieusement tout ce qui en dépend. Repéré parce que le total du
rapport par pad (37 frappes) ne correspondait pas au total agrégé du
score (19 frappes) sur une même session de test.

Corrigé en calculant le score une seule fois à partir de `scoreRef`
(ref déjà existante, tenue à jour de façon fiable — mise à jour
manuellement dans `onHit` en plus du rendu, pour rester juste même entre
deux frappes du même tick), puis en posant tous les `setState` côte à
côte plutôt qu'imbriqués.

Revérifié avec le même scénario après correctif : total du rapport par
pad et total agrégé du score strictement égaux (19 = 7+7+5). `npm run
typecheck` + `npm run build` + `npm test` au vert.

## Plan P1 — deuxième chantier : conversion Projet → Exercice

Avant d'écrire du nouveau code, vérification que `editorExercise()` et
`saveEditorExercise()` (déjà en place pour le SAVE du jeu) ne dépendent
d'aucune notion de mode — juste d'`editorTargets`/`tempo`/
`effectiveEditorBars`, déjà à jour quel que soit l'écran ouvert. Le
convertisseur existait donc déjà ; seule l'action pour le déclencher
depuis le Studio manquait. Ajouté : FICHIER › **Envoyer le pattern vers
Rhythm Hero** — convertit le pattern actif (groupe/numéro sélectionnés) en
exercice USER, immédiatement listé dans STYLE › EXERCICES USER du jeu,
sans fermer le Studio (contrairement au SAVE côté jeu, qui referme
l'éditeur).

Vérifié par un vrai scénario Playwright de bout en bout, pas par
supposition : pattern créé dans le Studio (une frappe KICK), projet
renommé « TEST CONVERSION », envoyé via FICHIER, retour à l'accueil, jeu
ouvert, exercice « TEST CONVERSION · A01 » retrouvé dans le sélecteur
STYLE, sélectionné, partition affichée avec la frappe correspondante —
aucune erreur console.

Limite assumée, pas cachée : un seul pattern à la fois, pas encore toute
une scène ou une sélection de mesures dans le Song — suffisant pour ce
premier chantier, à étendre si le besoin se confirme.

## Plan P1 — troisième chantier : édition de la vélocité d'un pas

`RhythmGrid.tsx` (grille rythmique du Studio) et `PianoRoll.tsx` (éditeur
KEYS) ne permettaient que le tout-ou-rien : un pas est présent ou absent,
avec `velocity`/`duration` toujours écrits à leur valeur par défaut
(`DEFAULT_NOTE_VELOCITY = 100`, `DEFAULT_NOTE_DURATION = 0.25`) sans aucun
moyen de les changer — alors que le modèle `SequencerNote`, l'export MIDI
et l'export `ep.project.v1` savent déjà transporter une vélocité par note
depuis le début. Premier morceau du chantier « édition expressive »
(REGISTRE_IDEES.md Q-12/E-16) : rendre la vélocité éditable là où c'est le
plus utilisé, la grille rythmique — gate/durée, micro-timing, multi-
sélection/nudge et l'édition note à note du piano-roll KEYS restent hors
scope, notés comme suite.

Interaction retenue : **Maj+molette** sur un pas rempli, ±8 par cran,
bornée à 1–127 (même échelle MIDI que l'export) ; retour visuel par
opacité du pas (plus vif = plus fort) et infobulle `Vélocité N/127`. Choix
du modificateur Maj plutôt qu'Alt (proposé par E-16 dans l'étude
d'origine) : Alt était déjà réservé à un zoom vertical non construit
(E-13), Maj était libre. La molette sans modificateur garde son usage
existant (défilement horizontal de la grille).

Bug réel trouvé en vérifiant avec Playwright, pas supposé : la première
implémentation utilisait le `onWheel` React posé directement sur chaque
bouton de pas. React enregistre son écouteur `wheel` délégué comme
**passif** par défaut (optimisation de défilement) ; `event.preventDefault()`
y échoue silencieusement (avertissement console seulement). Conséquence
observée à l'écran : le premier cran de molette Maj+molette ajustait bien
la vélocité, mais le deuxième cran du même geste scrollait la grille
verticalement sous le curseur au lieu d'ajuster la note — parce que rien
n'empêchait le défilement natif par défaut de s'exécuter en plus de notre
gestionnaire. Corrigé en écoutant l'événement `wheel` en natif
(`addEventListener('wheel', handler, { passive: false })`) directement sur
le conteneur de la grille dans un `useEffect`, avec des attributs
`data-measure`/`data-pad`/`data-step`/`data-section-key` sur chaque bouton
pour retrouver le pas visé sans dépendre du système d'événements React.

Couvre aussi bien un pas du pattern en cours d'édition qu'un pas d'une
scène déjà commitée dans le Song (même distinction que pour
`toggleEditorStep`/`toggleCommittedEditorStep`). Passe par le même
mécanisme d'historique que toute autre édition de pattern : un
Maj+molette isolé (plus de 500 ms après l'édition précédente) devient sa
propre étape Annuler/Rétablir, vérifié par un vrai scénario Playwright
(ajout d'une note, pause, changement de vélocité, pause, Ctrl+Z → revient
à la vélocité par défaut en conservant la note, second Ctrl+Z → supprime
la note).

Vérifié par scénarios Playwright réels : molette sans Maj laissée
inchangée (aucun effet sur la vélocité), Maj+molette haut/bas fait
monter/descendre la valeur affichée et exportée (vérifié dans le JSON
`ep.project.v1` téléchargé, pas seulement à l'écran), opacité CSS du pas
mesurée réellement différente de 1, granularité Annuler/Rétablir
confirmée sur deux scénarios distincts (édition groupée vs. espacée dans
le temps) — aucune erreur console au-delà de l'avertissement
`preventDefault` déjà présent ailleurs dans l'éditeur (défilement
horizontal), sans lien avec cette fonctionnalité.

Limite assumée, pas cachée : seule la grille rythmique (pas le piano-roll
KEYS note à note), et seule la vélocité (pas le gate/durée ni le
micro-timing) — le reste de Q-12 reste à faire.

## Plan P1 — quatrième chantier : bibliothèque unifiée (V1 : recherche et métadonnées)

`summarizeStudioProject()` recherché dans l'audit (« bibliothèque avec BPM,
durée, tags, miniature et recherche », REGISTRE_IDEES.md Q-13) : la liste
« MES PROJETS » de FICHIER › Ouvrir… n'affichait qu'un titre, sans aucun
moyen de retrouver un projet parmi plusieurs ni de savoir ce qu'il contient
sans l'ouvrir. Portée retenue pour cette V1 : recherche par titre et trois
métadonnées lisibles sans reparser le document ailleurs (BPM, nombre de
patterns non vides, date de modification), triée du plus récent au plus
ancien (`storeStudioProject`/`renameStudioProject` maintiennent déjà cet
ordre côté stockage). Tags, miniatures et détection des dépendances de
samples manquants restent hors scope — une vraie unification demanderait
d'y inclure aussi les exercices Rhythm Hero (`userExercises`, un stockage
séparé) et les clones machine (Fiche personnage), pas seulement les
projets Studio.

Vérifié par un vrai scénario Playwright : trois projets enregistrés sous
des titres différents (ALPHA GROOVE, BETA GROOVE, GAMMA TRACK), liste
« MES PROJETS » confirmée à 3 entrées avec BPM/nombre de
patterns/date affichés, recherche « GROOVE » filtrée à 2 résultats,
recherche vidée revenue à 3, recherche insensible à la casse (« gamma »
minuscule) filtrée à 1 résultat — aucune erreur console.

## Plan P1 — cinquième chantier : parcours 7 jours et 30 jours

Dernier item du plan P1 (REGISTRE_IDEES.md Q-14). Rien n'existait pour
savoir ce qui avait été joué un jour donné : `playerProfile.ts` ne garde
qu'un **cumul** (total de sessions, PERFECT/GOOD/MISS depuis toujours),
sans date ni style par séance — insuffisant pour un parcours.

Nouveau module pur `practicePlan.ts` : un journal daté
(`PracticeLogEntry {date, styleId, difficulty, perfect, good, miss}`,
`localStorage`, borné à 200 entrées) et `buildPracticePlan(log, styleIds,
days, todayISO)` qui construit un parcours de `days` jours à partir de
l'historique réel. Règle de rotation : les dix styles écrits à la main
(`DEDICATED_STYLE_IDS`, pas les 29 styles encore procéduraux ni les
exercices USER), un cran de difficulté en plus à chaque tour complet.
Règle de répétition : si le taux de MISS de la veille dépasse 25 % — même
seuil que `adviseTempo` dans `report.ts`, repris tel quel plutôt que
d'inventer un second seuil arbitraire — le jour suivant répète le même
style au même niveau au lieu d'avancer dans la rotation.

Point important documenté dans le code et ici : ce n'est **pas** un
calendrier figé à l'avance. Les jours déjà joués (`done`) reflètent
l'historique réel ; les jours futurs (`upcoming`) sont une prévision qui
suppose une progression normale et se recalcule à chaque consultation —
elle change si un jour intermédiaire déclenche une répétition entretemps.

Intégration : `stopGameTransport` (App.tsx) ajoute une entrée au journal
seulement pour une vraie séance jouée sur un style dédié (score non vide,
`DEDICATED_STYLE_IDS.includes(styleId)` — pas les styles procéduraux, pas
les exercices USER, qui ne font pas partie de cette rotation). Nouvelle
section « PARCOURS » dans la fiche personnage (bascule 7/30 jours, une
carte par jour avec style, niveau, date, résultat si déjà joué) ; un
bouton « COMMENCER » sur le jour du jour charge directement le style/
niveau recommandé dans le jeu (`onStartPracticeDay` réutilise
`changeStyle` déjà en place, pas un nouveau sélecteur).

Vérifié par un vrai scénario Playwright de bout en bout : parcours 7 puis
30 jours confirmés à 7 et 30 cartes, clic sur COMMENCER du jour 1 vérifié
chargeant bien le style « boom » dans le sélecteur du jeu, vraie séance
jouée (▶ JOUER, compte à rebours, 20 frappes réelles sur 3 pads), retour à
la fiche personnage : jour 1 passé en « done » avec le résultat exact
affiché (ex. 2P·0G·17M), jour 2 basculé en répétition du même style/
niveau avec l'étiquette RÉPÉTITION affichée — comportement attendu vu le
taux de MISS élevé de la séance de test.

Fonctionnalité couverte par les tests engine (`tools/check-engine.mjs`) :
rotation simple, avance de difficulté sur un tour complet, non-répétition
sur séance propre, répétition sur séance ratée, non-propagation de la
répétition à un jour non joué, styles dédiés absents (tableau vide, pas
d'exception).

**Constat annexe, hors scope de ce chantier, pas caché** : le scénario
Playwright de vérification a fait apparaître à deux reprises (avec et sans
clic STOP manuel) une erreur console Tone.js « The time must be greater
than or equal to the last scheduled time » lors de frappes rapprochées
pendant une séance jouée. Reproduite sans aucune ligne du diff de ce
chantier impliquée (aucun code audio touché) — signalée pour triage futur,
pas corrigée ici pour ne pas mélanger un correctif audio non vérifié avec
ce chantier.

## Méthode

Chaque chantier a suivi le même principe : comprendre le code existant
avant d'écrire quoi que ce soit, écrire un script ou un scénario Playwright
qui **démontre** le problème avant de le corriger quand c'est possible
(items 2 et 4), corriger, puis revérifier avec le même script/scénario
plutôt qu'une nouvelle relecture. Aucune fusion en conflit — chaque
chantier était un fast-forward pur sur `main`, `git status` du dossier
partagé jamais touché directement.

## Vérifications logicielles

- `npm run typecheck` + `npm run build` + `npm test` au vert après chacun
  des commits ;
- CI GitHub Actions maintenant active pour vérifier automatiquement la
  suite (typecheck + tests + build) sur ce dépôt à partir de ce jour ;
- captures d'écran et scénarios Playwright réels pour les items 1, 2 et 5 ;
- script Node isolé, avant/après correctif, pour l'item 4 ;
- scénarios Playwright réels pour le troisième chantier P1 (vélocité),
  dont un qui a lui-même révélé et fait corriger un bug d'écouteur passif
  avant d'être considéré comme preuve valable ;
- scénario Playwright réel pour le quatrième chantier P1 (bibliothèque) :
  trois projets réellement enregistrés, recherche filtrée puis vidée,
  insensibilité à la casse vérifiée ;
- tests engine (`tools/check-engine.mjs`) + scénario Playwright réel de
  bout en bout pour le cinquième chantier P1 (parcours), vraie séance
  jouée incluse, pas seulement une lecture du code produit.

## Priorités à la reprise

Plan P0 clos avec ce cinquième chantier — les cinq recommandations
partagées par les deux audits externes et l'analyse GPT sont maintenant
faites (identité de marque déjà en cours par ailleurs, Song Position,
Undo/Redo, dépendances+CI, audit Save/Load, dix parcours pédagogiques).

1. **Plan P1 clos** — les cinq items partagés par les deux audits externes
   et l'analyse GPT sont maintenant faits : rapport de progression par
   pad, conversion Projet → Exercice, édition de la vélocité d'un pas,
   recherche/métadonnées dans « Ouvrir… », parcours 7/30 jours (chacun
   partiel où documenté ci-dessus — voir aussi Q-12 et Q-13 pour ce qui
   reste : gate/micro-timing/multi-sélection/nudge, tags/miniatures/
   dépendances/unification avec les exercices Rhythm Hero et les clones
   machine) ;
2. « pad confondu » du rapport par pad, volontairement pas couvert
   aujourd'hui — comparer chaque MISS à ce qui était attendu sur un autre
   pad au même instant, pas juste le pad réellement joué ;
3. erreur console Tone.js « The time must be greater than or equal to the
   last scheduled time » repérée incidemment pendant la vérification du
   cinquième chantier P1 (frappes rapprochées en séance jouée) — à trier,
   sans lien avec le code ajouté aujourd'hui ;
4. mode KEYS mélodique pour Rhythm Hero — idée notée le 11/08, toujours
   remise à plus tard (voir mémoire `rhythm-hero-keys-mode-idea`) ;
5. vérifier côté utilisateur si les autorisations MIDI du navigateur
   expliquent le « NON CONNECTÉ » persistant signalé le 11/08 — toujours
   sans confirmation de l'utilisateur.
