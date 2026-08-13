# Bibliothèques techniques génériques — comparaison avec le code actuel

> Stack actuelle (`package.json`) : React 19, Vite 8, TypeScript 7, Tone.js
> 15, `fflate` (ZIP). Le TAR, le MIDI et le pont matériel sont **faits
> maison** dans `src/core/project/importers.ts` / `exporters.ts` et
> `tools/local_clone_bridge.py`. Cette étude vérifie, pour chaque brique,
> s'il existe une alternative mûre qui vaut la peine — et le dit clairement
> quand ce n'est **pas** le cas.

## Principe directeur

Le projet a une contrainte que la plupart des bibliothèques génériques
ignorent : **préserver les octets et champs inconnus d'une archive machine
réelle** (règle actée dans `PROJECT_CONTEXT.md`). Une bibliothèque TAR ou
MIDI générique reconstruit souvent un fichier « propre » à l'écriture, ce
qui perd exactement ce que nous devons garder. Ce principe guide chaque
recommandation ci-dessous : préférer une bibliothèque externe seulement
quand elle **lit/écrit des formats standards** (MIDI, ZIP, formats DAW),
jamais pour le format propriétaire EP-133 lui-même.

## MIDI (notes en temps réel)

**Actuel** : `src/core/midi/useWebMidi.ts`, hook fait maison au-dessus de
`navigator.requestMIDIAccess`, avec filtrage explicite des ports nommés
`EP-133` (pour éviter `Midi Through`), validé sur machine réelle.

**Alternative** : [`webmidi`](https://github.com/djipco/webmidi) (WebMidi.js,
npm `webmidi`, v3, définitions TypeScript incluses depuis la v2.3). Simplifie
l'énumération des ports, l'envoi de notes/CC/pitch-bend et les écouteurs
d'événements (`noteon`, `controlchange`…).

**Recommandation** : `NE PAS REMPLACER` le hook actuel. Il est validé sur
matériel réel, gère déjà le filtrage EP-133 spécifique et la logique SysEx
propriétaire (7-bit packing, request-id) que `webmidi` ne fournit pas de
toute façon — cette partie resterait maison quoi qu'il arrive. Le gain de
`webmidi` se limiterait à du sucre syntaxique sur la partie déjà simple
(notes standards). Risque de régression réelle pour un bénéfice faible.
Statut : `ÉCARTÉ`.

## MIDI (fichiers `.mid` import/export)

**Actuel** : lecteur/écrivain de fichier MIDI standard fait main dans
`importers.ts`/`exporters.ts` (`readVariableLength`, etc.), couvert par
`npm run test:exports`.

**Alternatives** :
- [`midi-file`](https://www.npmjs.com/package/midi-file) — parseur bas
  niveau, portable (tableaux plutôt que chaînes), sans dépendance.
- [`@tonejs/midi`](https://www.npmjs.com/package/@tonejs/midi) — construit
  sur `midi-file`, expose un JSON orienté Tone.js (déjà notre moteur audio).

**Recommandation** : `ÉCARTÉ` pour l'instant — notre lecteur/écrivain MIDI
est déjà testé et fonctionne. Mais si un bug d'interopérabilité MIDI
apparaît (fichier exporté par un autre logiciel qui ne se relit pas chez
nous), `midi-file` est le premier réflexe avant de corriger notre parseur à
la main : il est plus robuste aux variations réelles de fichiers `.mid`
« sauvages » que notre implémentation ciblée. À garder en tête comme
**filet de secours**, pas comme dépendance immédiate.

## TAR (archives de projet `.ppak`)

**Actuel** : `readTarMembers` fait main dans `importers.ts`, avec
vérification de somme de contrôle et préservation stricte des membres.

**Alternative en lecture** : [`js-untar`](https://www.npmjs.com/package/js-untar)
(navigateur uniquement, utilise des Web Workers, incompatible Node — donc
inutilisable tel quel dans nos scripts `tools/*.mjs` exécutés en Node).

**Alternative en écriture** (pertinent pour la Phase 5, jamais construite
chez nous) : pas de bibliothèque TAR-navigateur mature et largement utilisée
identifiée pour l'écriture ; `tar-stream` existe côté Node/Browserify mais
cible d'abord Node.js.

**Recommandation** : `ÉCARTÉ` pour la lecture (notre lecteur maison est déjà
plus adapté : préservation d'octets, testé, sans dépendance, fonctionne en
Node et navigateur). Pour l'**écriture** (Phase 5, encodeur `.ppak`),
`ÉTUDIER` `kmorrill/ep-series-sysex` (Python, déjà écrit et vérifié) comme
référence d'algorithme plutôt qu'une lib TAR JS générique : le vrai risque
n'est pas le format TAR lui-même (simple), mais l'exactitude du contenu
binaire des membres `pads/patterns`, qui est spécifique EP-133 et ne
viendra d'aucune lib générique.

## ZIP (conteneur `.pak/.ppak`)

**Actuel** : [`fflate`](https://www.npmjs.com/package/fflate), déjà en
dépendance (`unzipSync`).

**Recommandation** : `CONSERVER`. `fflate` est déjà un choix pertinent :
léger (~8 Ko), rapide, sans dépendance, largement utilisé. Rien trouvé de
meilleur pour notre cas d'usage pendant cette étude.

## Forme d'onde et édition audio visuelle (Roadmap Phase 4, jamais commencée)

**Alternatives comparées** :
- [`wavesurfer.js`](https://wavesurfer.xyz/) — le plus populaire
  (~10 000 ⭐), régions cliquables natives (utile pour le trim/slicing
  manuel A-09/A-10 de `docs/REGISTRE_IDEES.md`), plugin minimap, plugin
  spectrogramme, enregistrement micro. Limite : décode tout l'audio en
  mémoire via Web Audio, donc à surveiller sur de très longs fichiers.
- [`peaks.js`](https://github.com/bbc/peaks.js) (BBC) — pensé pour de gros
  fichiers via des données de waveform précalculées côté serveur ; moins
  pertinent chez nous car nos fichiers sont des samples courts locaux, pas
  des heures d'audio distant.

**Recommandation** : `INTÉGRER` `wavesurfer.js` comme première brique
concrète de la Phase 4 (« forme d'onde, trim, normalisation, fondu » —
actuellement `[ ]` non commencé). Les régions natives couvrent directement
A-09 (trim au sample) et A-10 (slicing sur grille/nombre fixe manuel).
Priorité **P1** dans
[04_RECOMMANDATIONS_INTEGRATION.md](04_RECOMMANDATIONS_INTEGRATION.md).

## Décodage et resampling audio (conversion vers 46 875/32 000/26 250 Hz)

**Constat important** : `AudioContext.decodeAudioData()` du navigateur
**rééchantillonne automatiquement** vers la fréquence du contexte, ce que
notre `docs/REFERENCE_SYSEX_EP133.md` note déjà comme un piège pour
l'analyse WAV (`wavAnalysis.ts` lit l'en-tête RIFF à la main pour cette
raison). Le même piège existe pour la **conversion** (pas seulement la
lecture) : il faut un resampler dont on contrôle précisément la fréquence
cible, indépendamment du `AudioContext` de la page.

**Alternatives** :
- [`@alexanderolsen/libsamplerate-js`](https://github.com/aolsenjazz/libsamplerate-js)
  — port WebAssembly de `libsamplerate` (référence historique en qualité de
  resampling), utilisable en Node comme en navigateur, contrôle exact de la
  fréquence de sortie.
- `ffmpeg.wasm` — plus lourd, mais couvre en plus le **décodage** de
  formats compressés (MP3/FLAC/OGG, besoin `A-02` du registre) que
  `libsamplerate-js` ne fait pas (il ne fait que rééchantillonner du PCM
  déjà décodé).

**Recommandation** : `INTÉGRER` `libsamplerate-js` en priorité pour la
conversion PCM → 46 875/32 000/26 250 Hz (Phase 4, et corrige/complète A-03
suite à la découverte du firmware 2.5 — voir
[05_FIRMWARE_2.5_IMPACT.md](05_FIRMWARE_2.5_IMPACT.md)). `ffmpeg.wasm`
seulement si l'import MP3/FLAC/OGG (A-02) est vraiment priorisé — c'est une
dépendance nettement plus lourde (plusieurs Mo de binaire WASM) à ne pas
ajouter avant d'en avoir besoin.

## Pont matériel local (`tools/local_clone_bridge.py`)

**Constat après lecture du code** (`tools/local_clone_bridge.py`,
`docs/PONT_LOCAL_CLONAGE.md`) : ce pont ne fait **pas** de communication
MIDI/USB bas niveau lui-même — le MIDI passe déjà par Web MIDI natif dans le
navigateur (`useWebMidi.ts`). Son unique rôle est de lancer en sous-processus
le moteur `tools/clone_ep133_readonly.py` (qui, lui, utilise `mido` +
`python-rtmidi` pour le SysEx ET écrit les fichiers clonés sur disque), puis
d'exposer sa progression via trois routes HTTP locales (`/health`,
`/clone/start`, `/clone/status`).

**Ce que ça change pour les pistes « Web Serial/WebUSB »** : ces API ne
remplaceraient pas ce pont, puisque le MIDI est déjà natif au navigateur et
que l'EP-133 ne s'expose pas comme un périphérique série USB classique
(c'est un device MIDI-Class). La vraie question n'est donc pas
« MIDI natif vs série », mais **« pourquoi ce moteur est-il en Python et pas
en TypeScript, dans la même page que le reste du Studio ? »**

**Recommandation** : `ÉTUDIER` sérieusement le portage du moteur de clonage
(`clone_ep133_readonly.py`) vers TypeScript dans le Studio lui-même, en
s'appuyant sur :
- Web MIDI (déjà utilisé) pour le SysEx ;
- la **File System Access API** (déjà utilisée pour le choix de dossier,
  cf. `PROJECT_CONTEXT.md` : « Les sélecteurs utilisent l'accès natif aux
  dossiers de Chrome/Chromium ») étendue à l'écriture de fichiers
  (`FileSystemWritableFileStream`) pour l'écriture atomique déjà exigée par
  nos règles.

Cela supprimerait entièrement la dépendance Python/venv pour le clonage et
réglerait d'un coup l'item non fait de la Roadmap Phase 3 « installer et
démarrer automatiquement le pont comme service utilisateur » — puisqu'il
n'y aurait alors plus de service à démarrer du tout. C'est un chantier non
trivial (portage complet d'un moteur avec reprise, hash SHA-256, historique
incrémental), donc à traiter comme un projet à part entière, pas une
substitution rapide. Voir la priorisation dans
[04_RECOMMANDATIONS_INTEGRATION.md](04_RECOMMANDATIONS_INTEGRATION.md).

**Complément (deuxième passe de recherche, 13 août)** : le hachage SHA-256 de
centaines de fichiers et le transfert SysEx séquentiel sont un travail assez
lourd pour bloquer la boucle d'événements React s'ils tournent sur le fil
principal. [`comlink`](https://github.com/GoogleChromeLabs/comlink)
(GoogleChromeLabs, ~1,1 Ko) simplifie exactement ce cas : exécuter le moteur
de clonage dans un Web Worker, avec une API RPC sans `postMessage` manuel,
pendant que l'interface reste réactive. Une piste concrète pour R-09, pas une
dépendance à ajouter avant que ce chantier ne démarre réellement.

## État applicatif React (découpage d'`App.tsx`)

**Constat** : Priorité n°1 de `docs/ROADMAP.md` Phase 1 (« Découper `App.tsx`,
centraliser le transport ») reste партiellement non faite ; `PROJECT_CONTEXT.md`
note explicitement qu'`App.tsx` garde l'état de l'éditeur « par décision
explicite, jusqu'à l'adoption d'un modèle de projet unique ».

**Alternatives comparées** :
- [`zustand`](https://github.com/pmndrs/zustand) — magasin centralisé, ~3 Ko,
  API minimale, migration incrémentale possible (on peut sortir un morceau
  d'état d'`App.tsx` à la fois sans tout réécrire), bon choix par défaut pour
  une équipe/agent qui doit garder le code compréhensible.
- [`jotai`](https://github.com/pmndrs/jotai) — modèle atomique, ~4 Ko,
  meilleur pour la réactivité fine (utile si le piano-roll/la grille
  redessine trop de cellules à chaque frappe — un vrai risque de perf sur
  une grille multi-mesures).

**Recommandation** : `ÉTUDIER` `zustand` comme magasin principal pour
extraire l'état du studio hors d'`App.tsx`, un domaine à la fois (ex.
commencer par l'état de sélection/transport, laisser le reste). Garder
`jotai` en réserve spécifiquement pour la grille d'édition si un problème de
performance de rendu est mesuré (ne pas l'ajouter par anticipation sans
mesure, cohérent avec la règle du projet « aucun gain de vitesse... annoncé
avant mesure »).

## Tests

**Actuel** : trois scripts Node ciblés
(`tools/check-engine.mjs`, `check-transport.mjs`, `check-project-exports.mjs`,
`check-wav-analysis.mjs`) lancés via `--experimental-strip-types`, plus des
scénarios Playwright *ad hoc* non committés (mentionnés dans plusieurs
rapports de session comme déjà utilisés pour vérifier chaque changement).
`docs/REGISTRE_IDEES.md` Q-03 note explicitement : « à formaliser ».

**Recommandation** : `INTÉGRER` [`vitest`](https://vitest.dev/) — natif Vite
(zéro configuration supplémentaire de bundler), watch mode, coverage,
compatible avec les mêmes modules `src/core/*` déjà testés à la main.
Migrer progressivement les 4 scripts `check-*.mjs` vers des fichiers
`*.test.ts` sous `vitest`, **sans changer la logique de test elle-même** —
seulement le harnais d'exécution. En parallèle, committer les scénarios
Playwright déjà utilisés en pratique (mentionnés dans
`docs/RAPPORT_SESSION_2026-08-11.md`/`-12.md`) dans un dossier `e2e/` versionné,
ce qui clôt enfin Q-03. Priorité **P0** (faible risque, comble une dette déjà
identifiée par l'équipe elle-même).

## Application installable hors ligne (PWA)

**Constat** : `docs/REGISTRE_IDEES.md` X-12 « Application hors ligne
installable » est `RETENU` (« PWA d'abord ») mais jamais commencé.

**Recommandation** : `INTÉGRER` [`vite-plugin-pwa`](https://github.com/vite-pwa/vite-plugin-pwa)
— plugin Vite officiel de l'écosystème `vite-pwa`, zéro-config pour générer
manifeste + service worker. C'est littéralement l'implémentation directe
d'un item déjà décidé mais non commencé. Priorité **P0/P1** : faible risque,
gain direct d'installabilité (utile pour un usage terrain avec la machine,
sans dépendre du réseau).

## Application de bureau (si le web ne suffit plus)

**Constat** : `docs/REGISTRE_IDEES.md` X-06 « Tauri + Rust » reste
`EXPÉRIMENTER`. Depuis la dernière analyse, **Tauri 2** a mûri, avec un
plugin série officiel (`tauri-plugin-serialplugin`, support desktop et
Android, pilotes Rust purs côté Android).

**Recommandation** : toujours `EXPÉRIMENTER`, pas de changement de statut.
Le portage du pont Python vers TypeScript navigateur (ci-dessus) doit être
tenté **avant** d'envisager Tauri : si la File System Access API et Web MIDI
suffisent (cas très probable vu ce que fait réellement le pont actuel),
Tauri devient inutile pour ce chantier précis. À garder en réserve pour un
besoin différent (accès disque hors navigateur supporté, packaging
desktop natif demandé par des utilisateurs).

## Deuxième vague de recherche (13 août, soir)

Poursuite de l'étude à la demande de l'utilisateur, centrée sur des besoins
précis déjà identifiés dans `docs/REGISTRE_IDEES.md` mais jamais outillés :
undo/redo au-delà du pattern, normalisation audio, détection de
transitoires, écriture d'en-tête RIFF propriétaire, et test du Web MIDI en
CI (blocage connu de Q-03).

### Undo/redo au-delà du pattern actif (E-25)

**Constat** : `docs/REGISTRE_IDEES.md` E-25 note « Fait pour l'édition d'un
pattern (Ctrl/Cmd+Z, coalescé) ; scènes/Song pas encore couverts ». C'est un
historique fait main (`editorHistory` dans `App.tsx`), un objet
`{ past, future }` par pattern.

**Trouvaille** : [`zundo`](https://github.com/charkour/zundo) (< 1 Ko),
middleware undo/redo pour **zustand** — que le Studio vient tout juste
d'adopter (R-08, store `languageStore.ts`). Zundo s'applique par store, pas
par composant : si un futur store `zustand` couvre les scènes/Song (au lieu
de rester du `useState` dans `App.tsx`), l'historique Annuler/Rétablir de
ce domaine s'obtient en enveloppant le store d'un seul middleware
`temporal(...)`, plutôt qu'en recopiant à la main le mécanisme
`past`/`future` déjà écrit pour le pattern.

**Recommandation** : `EXPÉRIMENTER`, pas immédiat. Pertinent seulement **si**
et **quand** l'état des scènes/Song sort d'`App.tsx` vers un store dédié
(suite logique de R-08) — ne pas l'ajouter avant, ce serait une dépendance
sans code à l'accrocher.

### Normalisation Peak/RMS/LUFS (A-06)

**Constat** : A-06 est `RETENU` mais rien n'est codé (« Peak d'abord ; LUFS
utile surtout aux contenus longs »).

**Trouvailles** :
- [`needles`](https://github.com/domchristie/needles) — mesure de loudness
  K-weighted (LUFS/LKFS) **dans le navigateur**, en direct (Web Audio) et
  hors ligne (analyse de fichier), visant la conformité EBU R128/BS.1770-4.
- [`@audio/loudness`](https://github.com/audiojs/loudness) — famille de
  modules `@audio/loudness-*` (LUFS, true peak, LRA, ReplayGain) sur le
  même standard, plus modulaire.

**Recommandation** : `ÉTUDIER` `needles` en premier (mesure hors ligne
directement utilisable sur un `AudioBuffer` décodé, sans dépendance
serveur) quand le préparateur audio de la Phase 4 démarrera réellement — nos
samples EP-133 étant courts (pads, pas des morceaux entiers), Peak reste
prioritaire comme déjà décidé ; LUFS est un raffinement, pas un bloquant.

### Détection de transitoires (A-11)

**Constat** : A-11 est `REPORTÉ` avec une piste déjà choisie : « flux
spectral après validation du slicing manuel ».

**Trouvaille** : [`@audio/beat`](https://github.com/audiojs/beat-detection)
propose justement quatre algorithmes dont le **flux spectral en algorithme
par défaut** — exactement l'approche déjà retenue dans le registre, pas une
piste concurrente à arbitrer. `essentia.js` (WASM, plus complet mais plus
lourd) reste une alternative si `@audio/beat` s'avère insuffisant en
pratique.

**Recommandation** : rester `REPORTÉ` comme décidé (le slicing manuel doit
être validé d'abord), mais retenir `@audio/beat` comme prem她re bibliothèque
à essayer le jour où A-11 redevient actif — évite de réévaluer l'écosystème
à ce moment-là.

### Écriture d'en-tête RIFF propriétaire EP-133

**Constat** : `docs/REFERENCE_SYSEX_EP133.md` liste « lecture et écriture
locale de l'en-tête RIFF propriétaire » parmi ce qui peut être intégré sans
risque immédiat, et `docs/ROADMAP.md` Phase 4 note « Génération d'en-tête
RIFF EP-133 : à faire ».

**Trouvaille** : [`wavefile`](https://github.com/rochars/wavefile) lit et
écrit déjà les chunks `LIST`/`INFO` génériques, les points `cue`, les
régions, le chunk BWF `bext`, et convertit bit depth/fréquence
d'échantillonnage. Il ne connaît pas le format spécifique EP-133 (JSON dans
un bloc `LIST/INFO/ITNG`, cf. `docs/REFERENCE_SYSEX_EP133.md`), mais gérer
la structure RIFF générique à sa place éviterait de réécrire un parseur
`LIST/INFO` bas niveau — seul le bloc `ITNG` propriétaire resterait à coder
à la main, sur la structure déjà fournie par la bibliothèque.

**Recommandation** : `ÉTUDIER` au moment d'attaquer la génération d'en-tête
RIFF EP-133 (Phase 4). Économiserait probablement plus de code que le
`wavAnalysis.ts` actuel (qui lit l'en-tête à la main volontairement, pour
éviter le rééchantillonnage silencieux de `decodeAudioData()` — un problème
que `wavefile` n'a pas puisqu'il ne décode pas l'audio, il manipule
directement les octets RIFF).

### Stockage local des dossiers clonés : OPFS n'est *pas* un bon remplacement

**Constat** : en creusant l'alternative « Web Serial/WebUSB » de la
première vague (voir la section pont local ci-dessus), la question naturelle
suivante est l'**Origin Private File System (OPFS)**, présenté partout comme
nettement plus rapide que la File System Access API pour l'écriture de gros
volumes (accès en place, pas de boîte de dialogue de permission, fichiers de
300 Mo+ sans souci).

**Pourquoi ce n'est pas le bon outil ici** : OPFS est un espace de stockage
**privé à l'origine du site**, invisible dans l'explorateur de fichiers
normal de l'utilisateur. Or `PROJECT_CONTEXT.md` est explicite : « Ne jamais
employer "upload" : les PCM restent sur le HDD et seul le manifeste est
écrit dans `clone/nom-machine/` par le navigateur » — le clone doit
atterrir dans un **dossier choisi et visible par l'utilisateur**, pas dans
une case cachée du navigateur. OPFS résoudrait un problème de vitesse que
nous n'avons pas encore mesuré, en cassant une exigence produit explicite.

**Recommandation** : `ÉCARTÉ` pour le clone lui-même. La **File System
Access API** reste le bon choix pour R-09 malgré sa lenteur relative. OPFS
resterait pertinent pour un usage totalement différent — un cache technique
interne invisible de l'utilisateur (ex. buffers de rendu audio temporaires)
— mais aucun besoin de ce type n'est identifié aujourd'hui dans le Studio.

### Tester le Web MIDI sans machine ni navigateur graphique (Q-03)

**Constat** : les scénarios Playwright déjà utilisés en pratique (mentionnés
dans plusieurs rapports de session) ne sont toujours pas committés en CI —
en partie parce que le Web MIDI réel n'existe pas dans un Chromium headless
sans périphérique.

**Trouvaille** : la documentation Playwright elle-même donne le patron pour
ce cas exact — `page.addInitScript()` injecté avant le chargement de la
page pour remplacer `navigator.requestMIDIAccess` par un faux objet
(`inputs`/`outputs` en `Map`, `addEventListener` no-op), avant que
l'application ne s'exécute. C'est exactement le mécanisme qu'il faut pour
committer une CI qui vérifie l'UI de connexion/déconnexion MIDI sans
matériel réel ni extension navigateur.

**Recommandation** : `INTÉGRER` au moment de committer les premiers
scénarios Playwright (R-04, reste de Q-03). Ne remplace pas la validation
sur machine réelle (toujours nécessaire pour le mapping SysEx), mais
permet de committer des tests de **régression d'interface** (l'app affiche
bien « connecté », le sélecteur de port réagit, etc.) qui ne dépendent pas
d'un EP-133 branché à la machine CI.

### Déduplication par empreinte audio, au-delà du SHA-256 (A-09)

**Constat** : A-09 est `EXPÉRIMENTER` avec la note « Hash du signal décodé ;
aucune fusion automatique ». Un hash SHA-256 du signal détecte des doublons
strictement identiques bit à bit, mais pas deux exports du même son à un
gain ou un trim légèrement différent — un cas réaliste vu le nombre de
projets/samples observés sur une machine réelle (527 sons).

**Trouvaille** : [`chromaprint.js`](https://github.com/bjjb/chromaprint.js)
— implémentation JS du fingerprinting perceptif AcoustID/Chromaprint, conçu
précisément pour la détection de doublons quasi identiques, pas seulement
identiques.

**Recommandation** : `SURVEILLER` seulement. Complexité et faux positifs
potentiels bien supérieurs à un hash SHA-256 simple ; à réévaluer
uniquement si un vrai besoin de dédoublonnage « quasi identique » est
signalé par un usage réel, pas en anticipation. Le SHA-256 déjà prévu par
A-09 reste le bon point de départ.

### Stockage local à faible enjeu (`idb`)

`src/core/storage/directoryHandleStore.ts` (84 lignes) enveloppe déjà
IndexedDB à la main pour le seul object store dont le Studio a besoin
aujourd'hui. [`idb`](https://github.com/jakearchibald/idb) (Jake
Archibald, ~1,2 Ko) ferait la même chose avec moins de code, mais le fichier
actuel fonctionne, est court et déjà testé.

**Recommandation** : `ÉCARTÉ` — ne pas remplacer du code qui marche pour
gagner 20 lignes. À reconsidérer seulement si un deuxième object store
apparaît et que la duplication de boilerplate devient réelle.

## Tableau récapitulatif

| Brique | Recommandation | Priorité |
|---|---|---|
| MIDI temps réel (`webmidi`) | Écarté, garder le hook maison | — |
| MIDI fichier (`midi-file`) | Filet de secours, pas immédiat | — |
| TAR lecture | Écarté, garder le lecteur maison | — |
| TAR écriture (Phase 5) | Étudier `ep-series-sysex` comme référence | P0 |
| ZIP (`fflate`) | Conserver tel quel | — |
| Waveform (`wavesurfer.js`) | Intégrer | P1 |
| Resampling (`libsamplerate-js`) | Intégrer | P1 |
| Décodage compressé (`ffmpeg.wasm`) | Différer jusqu'à besoin réel A-02 | P2 |
| Pont local → TypeScript natif | Étudier comme chantier dédié | P1 |
| État global (`zustand`) | Étudier pour découper `App.tsx` | P1 |
| État fin (`jotai`) | Réserve, seulement si perf mesurée | P2 |
| Tests (`vitest` + Playwright committé) | Intégrer | P0 |
| PWA (`vite-plugin-pwa`) | Intégrer | P0/P1 |
| Desktop (Tauri 2) | Rester en expérimentation | P2 |
| Undo/redo multi-store (`zundo`) | Réserve, seulement quand scènes/Song ont leur store | P2 |
| Loudness LUFS (`needles`) | Étudier pour la Phase 4 (A-06) | P2 |
| Transitoires (`@audio/beat`) | Confirme le choix déjà fait pour A-11 | P2 |
| Écriture RIFF (`wavefile`) | Étudier pour la Phase 4 (en-tête RIFF EP-133) | P2 |
| Stockage clone (OPFS) | Écarté — casse une règle produit explicite | — |
| Test Web MIDI en CI (`page.addInitScript`) | Intégrer avec R-04/Q-03 | P1 |
| Dédoublonnage perceptif (`chromaprint.js`) | Surveiller seulement (A-09) | P2 |
| IndexedDB (`idb`) | Écarté — code actuel déjà court et testé | — |
