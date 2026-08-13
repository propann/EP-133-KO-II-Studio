# Registre des idées produit

Ce registre conserve toutes les idées issues des études, même lorsqu'elles ne
sont pas intégrées à la feuille de route active. Une idée écartée n'est pas
effacée : son motif reste consultable et la décision peut être réexaminée si de
nouvelles preuves apparaissent.

## Statuts

- **RETENU** : prévu dans une phase de la feuille de route.
- **EXPÉRIMENTER** : prototype ou mesure nécessaire avant décision.
- **REPORTÉ** : intéressant, mais hors du chemin critique actuel.
- **ÉCARTÉ V1** : ne fait pas partie de la version 1.
- **CORRIGÉ** : intention conservée avec une base technique rectifiée.
- **RÉALISÉ** : présent et vérifié dans le projet.

## Fichiers, machine et sécurité

| ID | Idée | Statut | Décision ou condition |
|---|---|---|---|
| F-01 | Détection automatique et Web MIDI | RÉALISÉ | Connexion entrées/sorties, suivi branchement/débranchement et distinction MIDI/SysEx disponibles |
| F-02 | Lecture de l'identité/SKU | RETENU | Préserver `meta.json` d'une base réelle ; ne pas dépendre uniquement de l'Identity Reply |
| F-03 | Décodeur `.pak/.ppak` ZIP + TAR | RÉALISÉ | Lecture seule validée sur le projet 1 réel |
| F-04 | Encodeur `.pak/.ppak` | RETENU | Seulement par modification d'une copie réelle avec comparaison binaire |
| F-05 | Sauvegarde « projets seulement » | RETENU | Mesurer le temps réel, ne pas promettre arbitrairement moins de 60 secondes |
| F-06 | Restauration locale | RETENU | Checkpoint, projet brouillon, relecture après écriture |
| F-07 | Monitoring mémoire | RETENU | Capacité détectée, jamais supposée à 64 ou 128 Mo |
| F-08 | Sons orphelins | RETENU | Analyse de tous les projets, proposition seulement |
| F-09 | Déduplication SHA-256 | EXPÉRIMENTER | Hash du signal décodé ; aucune fusion automatique |
| F-10 | Écriture directe flash | REPORTÉ | Verrouillée jusqu'aux tests aller-retour et procédure de restauration |
| F-11 | Profil nommé par machine | RÉALISÉ | Nom local et capacité 64/128 Mo conservés dans le navigateur |
| F-12 | Miroir initial complet | RETENU | Inventaire, projets et audio privé dans un dossier choisi |
| F-13 | Synchronisation par patch | RETENU | Diff, conflits, checkpoint, confirmation et relecture obligatoires |
| F-14 | Plusieurs machines | RETENU | Identité matérielle vérifiée avant d'appliquer le profil associé |
| F-15 | Dossier samples dédié | RÉALISÉ | Association UI livrée ; accès persistant via pont local encore requis |
| F-16 | Time Machine des états EP-133 | RÉALISÉ (partiel) | 12 août — chronologie et comparaison métadonnées réelles (`deviceProfile.ts` : `history` s'accumule enfin, au lieu d'être réécrasé à chaque SCAN/CLONE ; delta sons/Mo/projet affiché) dans le dialogue CLONER, y compris un bug de migration (« NaN son » sur d'anciens manifestes) trouvé et corrigé le même jour — détail dans Q-16. Restauration locale (projet/sample isolé) et patch matériel sécurisé non commencés — la restauration nécessiterait un stockage versionné réel sur disque, pas seulement des métadonnées |

## Samples et audio

| ID | Idée | Statut | Décision ou condition |
|---|---|---|---|
| A-01 | Import WAV/AIFF | RETENU | Première étape du préparateur audio |
| A-02 | Import MP3/FLAC/OGG | RETENU | Après sélection et test du décodeur |
| A-03 | Conversion 44,1 kHz | RÉALISÉ (partiel) | 13 août — `wavConvert.ts` : conversion vers une cible explicite (jamais une fréquence fixe supposée, corrigé après R-03/firmware 2.5), `EP133_TARGET_SAMPLE_RATES` = LO 26 250/MID 32 000/HI 46 875 Hz. Resampling `libsamplerate-js`, qualité maximale. Non vérifié à l'œil ni à l'oreille par l'utilisateur — voir `docs/A_VALIDER_PHYSIQUEMENT.md` |
| A-04 | Dither TPDF | RÉALISÉ | 13 août — `encodeWavPcm16` applique systématiquement un dither TPDF (deux uniformes indépendantes) à l'encodage 16 bits, testé dans `tools/check-wav-convert.mjs` |
| A-05 | Mono, stéréo, gauche ou droite | RÉALISÉ (partiel) | 13 août — repli mono/stéréo par moyenne dans `wavConvert.ts`, testé. Pas de choix gauche/droite explicite ni de contrôle de phase — reste à faire |
| A-06 | Normalisation Peak/RMS/LUFS | RETENU | Peak d'abord ; LUFS utile surtout aux contenus longs |
| A-07 | Limiteur de sécurité | RETENU | Option explicite et comparaison avant/après |
| A-08 | Auto-trim avec seuil | RETENU | Seuil, garde d'attaque et relâchement configurables |
| A-09 | Forme d'onde et trim au sample | RÉALISÉ (partiel) | 13 août — `WaveformTrim` dans Sons & Transfert (bibliothèque perso), région ajustable, non destructif : la sélection s'affiche mais rien ne la consomme encore. Vérifié visuellement par l'utilisateur dans Chrome (forme d'onde, glisser de région, lecture) |
| A-10 | Slicing sur grille/nombre fixe | RETENU | Le trim manuel (A-09) est la première brique ; le slicing sur grille/nombre fixe lui-même reste à faire |
| A-11 | Détection de transitoires | REPORTÉ | Flux spectral après validation du slicing manuel |
| A-12 | Préécoute au survol | EXPÉRIMENTER | Risque de déclenchements involontaires ; clic et MIDI prioritaires |
| A-13 | Affectation automatique des slices | CORRIGÉ | 48 pads visibles, 12 par groupe ; slots sonores 1–999 |
| A-14 | Space-Saver +7 à +12 demi-tons | EXPÉRIMENTER | Comparaison audible et mesure du gain ; aucune promesse de capacité doublée |
| A-15 | Stems WAV | REPORTÉ | Nécessite les samples et un moteur de rendu fidèle |

## Séquenceur et ergonomie

| ID | Idée | Statut | Décision ou condition |
|---|---|---|---|
| E-01 | Piano-roll multipiste à 96 PPQN | RETENU | Le modèle doit conserver les ticks, pas seulement les pas visuels |
| E-02 | Step-sequencer 16 à 99 pas | CORRIGÉ | Grille configurable ; la machine exprime surtout 1–99 mesures, pas une limite native de 99 pas |
| E-03 | Vélocité en histogramme | RETENU | Bande repliable sous le piano-roll |
| E-04 | Micro-timing au tick | RETENU | Position entière 96 PPQN, pas un faux champ « micro-shift 0–95 » |
| E-05 | Gate time par poignée | RÉALISÉ (partiel) | Implémenté avec Alt+molette (12 août), pas une poignée de glissement — même mécanisme que E-16 (vélocité), ±1/16 de temps par cran, borné 1/16–4 temps, retour visuel par épaisseur de bordure. Grille rythmique seulement, pas KEY/LEGATO (piano-roll) ni sections commitées |
| E-06 | Ratcheting/Note Repeat | EXPÉRIMENTER | Représenter d'abord comme notes répétées ; champ natif dédié non prouvé |
| E-07 | Clic gauche pour créer | RETENU | Seulement dans la grille active |
| E-08 | Clic droit pour supprimer | EXPÉRIMENTER | Neutraliser le menu contextuel uniquement dans l'éditeur et fournir une alternative clavier |
| E-09 | Double-clic créer/supprimer | ÉCARTÉ V1 | Ambigu dans l'étude et conflictuel avec le clic simple |
| E-10 | Alt + glisser sans grille | RETENU | Déplacement et durée au tick près |
| E-11 | Pan par clic molette | RETENU | Ajouter aussi barres de défilement et gestes trackpad |
| E-12 | Ctrl + molette zoom horizontal | RETENU | Zoom centré sur le pointeur |
| E-13 | Alt + molette zoom vertical | EXPÉRIMENTER | Conflit E-16 levé (vélocité passée sur Shift, pas Alt) ; reste à faire |
| E-14 | Shift + molette défilement horizontal | CORRIGÉ | Le défilement horizontal utilise la molette seule (sans modificateur) depuis le début ; Shift+molette est réservé à la vélocité depuis le 12 août — ce document décrivait une intention jamais implémentée telle quelle |
| E-15 | Sélection rectangulaire | RÉALISÉ (partiel) | Implémenté avec Ctrl/Cmd+clic (12 août), pas encore un glisser-rectangle — bascule un pas à la fois dans la sélection, plus simple à livrer qu'une géométrie de marquee, sélection rectangulaire par glisser reste une extension possible |
| E-16 | Alt + molette vélocité | RÉALISÉ | Implémenté avec Shift, pas Alt (12 août) : Maj+molette sur un pas rempli, delta ±8, clampé 1–127, retour opacité+infobulle, écouteur natif non passif (le `onWheel` React délégué est passif et avale `preventDefault()` en silence — un vrai test Playwright l'a révélé : le second cran d'un même geste scrollait la grille au lieu d'ajuster la note). Couvre la grille rythmique ET le piano-roll KEYS note à note (étendu le même jour, même mécanisme réutilisé directement) |
| E-17 | Dupliquer Ctrl/Cmd+D | RETENU | Duplication à la suite avec Annuler |
| E-18 | Flèches : déplacer/transposer | RÉALISÉ (partiel) | Déplacement dans le temps (gauche/droite, 12 août) fait — `nudgeSelectedNotes` (editor.ts), tout ou rien si ça sortirait de la grille, note déplacée qui remplace une note immobile à la même position. Transposition (haut/bas, changer de pad) pas encore faite |
| E-19 | Shift + flèches : octave | RETENU | Pour les pistes mélodiques uniquement |
| E-20 | Ctrl/Cmd+Q quantifier | RETENU | Opération non destructive et annulable |
| E-21 | M ou 0 pour muter une note | EXPÉRIMENTER | État d'édition local non natif ; définir son comportement à l'export |
| E-22 | B outil lame | REPORTÉ | Faible priorité pour des événements de notes ; la poignée de durée suffit d'abord |
| E-23 | Ctrl+1/2 résolution de grille | RETENU | Intercepter uniquement dans l'éditeur |
| E-24 | Espace lecture/pause | RETENU | Ne jamais faire défiler la page quand l'éditeur a le focus |
| E-25 | Annuler/Rétablir | RÉALISÉ (partiel) | Fait pour l'édition d'un pattern (11 août, coalescé, Ctrl/Cmd+Z) ; scènes/Song pas encore couverts |
| E-26 | Accessibilité clavier | RETENU | Toute action souris essentielle doit avoir un équivalent clavier |

## Paramètres, scènes et contrôle live

| ID | Idée | Statut | Décision ou condition |
|---|---|---|---|
| P-01 | Attack/Release graphique | CORRIGÉ | Plage binaire observée 0–255, pas ADSR 0–99 |
| P-02 | Filtre LPF/HPF par pad | CORRIGÉ | Paramètres de groupe/fader ; résonance native non confirmée |
| P-03 | Automations de fader | RETENU | Layout lu ; édition après préservation aller-retour |
| P-04 | FX Punch-In sur la grille | REPORTÉ | Sémantique binaire incomplète |
| P-05 | Assignation des 12 cibles fader | RETENU | Paramètres internes du groupe, à ne pas confondre avec des CC externes |
| P-06 | Configuration libre des CC | REPORTÉ | CC réellement reçus/émis à vérifier par captures |
| P-07 | Matrice des 99 scènes | RETENU | Références complètes et patterns existants obligatoires |
| P-08 | Réorganisation/duplication de scènes | RETENU | Après validation de l'encodeur de scènes |
| P-09 | Canal MIDI par pad | RETENU | Champ lu dans chaque enregistrement de pad |
| P-10 | Routage vers Supertone | ÉCARTÉ V1 | Supertone appartient à l'EP-40, pas à l'EP-133 |
| P-11 | Pads PC ↔ machine | RÉALISÉ | MIDI OUT du studio et MIDI IN déjà disponibles ; sélection A–D bidirectionnelle via FILE avec relecture |
| P-12 | Suivi du fader physique | EXPÉRIMENTER | Capturer les messages réels avant de concevoir l'interface |
| P-13 | Miroir LCD complet | ÉCARTÉ V1 | État complet non exposé par un protocole vérifié |

## Exports et architecture

| ID | Idée | Statut | Décision ou condition |
|---|---|---|---|
| X-01 | Export MIDI | RÉALISÉ | Aller-retour automatisé désormais testé |
| X-02 | Export DAWproject | REPORTÉ | Premier candidat DAW après `.ppak` stable |
| X-03 | Export REAPER `.rpp` | REPORTÉ | Format texte accessible, après DAWproject |
| X-04 | Export Ableton `.als` | REPORTÉ | Format propriétaire et frontière AGPL à respecter |
| X-05 | Export natif FL Studio | ÉCARTÉ V1 | Aucun chemin fiable démontré dans l'étude |
| X-06 | Tauri + Rust | EXPÉRIMENTER | Évaluer après mesure des limites Web/bridge Python |
| X-07 | React/TypeScript | RÉALISÉ | Architecture actuelle conservée |
| X-08 | Canvas/PixiJS | EXPÉRIMENTER | Canvas seulement si le DOM ne tient pas la charge mesurée |
| X-09 | TailwindCSS | ÉCARTÉ V1 | Le thème CSS actuel est établi et maîtrisé |
| X-10 | VST3/CLAP | ÉCARTÉ V1 | Complexité et maintenance hors périmètre |
| X-11 | Générateur algorithmique | REPORTÉ | Après éditeur, formats et bibliothèque stables |
| X-12 | Application hors ligne installable | RETENU | PWA d'abord ; paquet desktop seulement si nécessaire |

## Qualité logicielle et stratégie produit

Issues du croisement du 11 août 2026 entre deux études externes apportées par
l'utilisateur (`Rapport_audit_EP133_KOII_Studio.docx`,
`Etude_produit_concurrents_EP133_Studio_2026.docx`) et l'état réel vérifié du
dépôt à cette date (`git log`, `package.json`, recherche de code). Une
synthèse indépendante des mêmes documents, produite en parallèle
([ANALYSE_GPT_EP133_KOII_STUDIO.md](ANALYSE_GPT_EP133_KOII_STUDIO.md)),
aboutit aux mêmes priorités P0 — recoupement qui renforce la confiance dans
ce classement plutôt qu'un simple avis isolé.

| ID | Idée | Statut | Décision ou condition |
|---|---|---|---|
| Q-01 | Pinner les dépendances (retirer tous les `latest`) | RÉALISÉ | 11 août — versions en `^` figées sur ce qui était installé, lockfile regénéré, `npm ci` revérifié à froid |
| Q-02 | CI qualité (typecheck + tests + build sur chaque PR) | RÉALISÉ | 11 août — `.github/workflows/ci.yml`, distinct de `deploy-pages.yml` (déploiement) |
| Q-03 | Pyramide de tests (unitaire/intégration/E2E) | RÉALISÉ (partiel) | Harnais Vitest ajouté pour les scripts historiques (R-04). 13 août — premier test E2E réel avec Playwright (R-16) : Web MIDI simulé, écran d'accueil vérifié en exécution réelle, câblé en CI. Reste à élargir la couverture E2E au-delà de l'accueil (Studio, Sons & Transfert) |
| Q-04 | Adaptateur versionné autour d'`ep-series-sysex` (MIT) | EXPÉRIMENTER | Éviter de réimplémenter seul le protocole d'écriture SysEx ; dépendance stratégique externe à évaluer avant la Phase 5 |
| Q-05 | Positionnement « Learning & Project OS » (Coach / Composer / Time Machine / Open Interop / Local First) | RETENU | Cadre de différenciation face à EP-PatchStudio (menace critique identifiée) ; à formaliser dans la doc produit et la page d'accueil, pas de changement de code requis |
| Q-06 | Écran diagnostic MIDI complet (latence, jitter, port filtré, dernière note) | RETENU | Symptôme réel déjà observé cette session (« NON CONNECTÉ » persistant côté utilisateur malgré un port libre) — pas seulement une recommandation théorique. Cause du symptôme confirmée le 12 août avec la vraie machine branchée (autorisation SysEx du navigateur, pas un bug — voir CONNEXION_ET_CALIBRATION_MIDI.md) ; l'écran diagnostic complet lui-même reste à construire |
| Q-07 | Rapport de progression par pad après une session Rhythm Hero | RÉALISÉ | 12 août — pads triés du plus fauté au moins fauté, écart signé par pad, conseil de tempo ; bug réel trouvé et corrigé au passage (setPlayerNotes imbriqué dans l'updater de setScore, doublé par StrictMode). « Pad confondu » (12 août, plus tard le même jour) : `scoreHit` détecte, sur un MISS, une cible non jouée sur un AUTRE pad dans la fenêtre GOOD ; `buildPadReport` remonte le pad le plus souvent visé par erreur, signalé seulement à partir de 2 occurrences (bruit sinon) ; affiché « ↷ SOUVENT CONFONDU AVEC … » dans le rapport. Comparaison de métadonnées de timing seulement, pas une détection de posture/doigté |
| Q-08 | Onboarding « Découvrir sans machine » avec projet exemple | REPORTÉ | Utile pour l'adoption, mais la Phase 1 (socle) doit rester prioritaire |
| Q-09 | Terminologie rassurante (« copie de sécurité », « plan de modifications » plutôt que « synchroniser ») | EXPÉRIMENTER | Déjà partiellement appliqué (SYNCHRONISER décrit précisément ce qu'il fait dans Sons & Transfert) ; à généraliser à toute l'interface |
| Q-10 | Audit du cycle Save→quitter→rouvrir | RÉALISÉ | 12 août — un vrai bug trouvé et corrigé : `note ?? 60` à l'export corrompait tout pad-trigger en note MIDI fixe après un aller-retour Sauvegarder→Ouvrir ; voir VALIDATION_SAVE_LOAD_STUDIO.md |
| Q-11 | Conversion Projet → Exercice (Studio → Rhythm Hero) | RÉALISÉ | 12 août — FICHIER › Envoyer le pattern vers Rhythm Hero, réutilise editorExercise()/saveEditorExercise déjà en place ; un seul pattern à la fois, pas encore toute une scène/Song ni de sélection de mesures |
| Q-12 | Édition expressive : vélocité, gate, micro-timing, multi-sélection, nudge | RÉALISÉ (partiel) | 12 août — vélocité (Maj+molette, E-16) dans la grille rythmique ET le piano-roll KEYS ; gate/durée (Alt+molette, E-05) dans la grille rythmique ; multi-sélection (Ctrl/Cmd+clic, E-15) et nudge temporel (flèches gauche/droite, E-18) dans la grille rythmique. Un vrai bug trouvé en vérifiant le gate : `horizontalWheelScroll` appelait `stopPropagation()` pour tout molette non-Maj, empêchant Alt+molette d'atteindre l'écouteur dédié — Alt+molette ne faisait strictement rien avant le correctif. Restent : micro-timing hors grille (au tick), transposition verticale (E-19), sélection par glisser-rectangle, gate sur le piano-roll KEYS et les sections commitées |
| Q-13 | Bibliothèque unifiée : recherche, tags, miniatures, dépendances | RÉALISÉ (partiel) | 12 août — recherche par titre et métadonnées (BPM, nombre de patterns non vides, date) dans « Ouvrir… » (`summarizeStudioProject`), triée par date de modification. Détection des dépendances manquantes ajoutée le même jour : `findMissingDependencies` (device.ts) compare les affectations son → pad enregistrées dans un projet à l'index sonore actuellement scanné, avertissement affiché à l'ouverture s'ils divergent (testé avec les 32 vrais pads de la machine réellement branchée). Ne couvre que les projets Studio (pas les exercices Rhythm Hero ni les clones machine), et tags/miniatures restent à construire |
| Q-14 | Parcours 7 jours et 30 jours avec répétition des difficultés | RÉALISÉ | 12 août — `practicePlan.ts` : journal daté des séances (séparé du cumul de `playerProfile.ts`), rotation des dix styles dédiés avec un cran de difficulté par tour complet, répétition automatique du jour précédent si MISS > 25 % (seuil repris d'`adviseTempo`) ; section PARCOURS dans la fiche personnage, bouton COMMENCER qui charge directement le style/niveau du jour dans le jeu ; parcours recalculé à chaque consultation, pas un calendrier figé |
| Q-15 | P2 item 2 : préparer le WAV de façon déterministe et rapporter poids, durée, fréquence et saturation | RÉALISÉ | 12 août — `wavAnalysis.ts` : en-tête RIFF/fmt lu à la main (pas `decodeAudioData()`, qui rééchantillonne parfois), PCM 8/16/24/32 bits et float 32 bits, écrêtage détecté sur le code numérique exact ; fiche audio affichée à l'écoute d'un son perso dans Sons & Transfert. Les items 1/3/4/5 du plan P2 touchent à une écriture matérielle réelle et restent hors de portée du travail logiciel seul (consigne stricte de lecture seule sur la machine physique) — non commencés, pas oubliés |
| Q-16 | P2 item 5 : Time Machine locale avant toute restauration matérielle | RÉALISÉ (partiel) | 12 août — voir F-16. Vrai bug corrigé : `history` existait dans le manifeste depuis le début mais était toujours réécrasé à une seule entrée à chaque SCAN/CLONE au lieu de s'accumuler ; `createDeviceClone` lit désormais le manifeste précédent et ajoute un point daté avec comparaison (sons/Mo/projet). Le dialogue CLONER affiche la vraie chronologie à la place de la mention statique « Prévu : … » qui y était. **Deuxième bug trouvé en revérifiant ce chantier le même jour** : un manifeste écrit par le code d'avant ce correctif n'a que `{ createdAt, label }` par entrée — comparer un nouveau point à une ancienne entrée sans `soundCount`/`usedBytes` produisait `NaN - undefined = NaN`, affiché littéralement comme « NaN son » dans l'étiquette. Corrigé par un garde-fou `Number.isFinite()` par champ dans `describeCloneDelta`, avec un test de migration dédié (`tools/check-project-exports.mjs`) reproduisant un ancien manifeste puis vérifiant l'absence de `NaN`. Restauration (locale ou matérielle) non commencée — nécessiterait un stockage versionné réel des PCM, pas seulement des métadonnées |
| Q-17 | Erreur console Tone.js « time must be greater than or equal to the last scheduled time » (signalée incidemment le 12 août pendant la vérification du parcours) | RÉALISÉ | 12 août — vrai bug de conception, pas un flake : le modèle programmé (`Tone.Transport.schedule`, avec anticipation) et les frappes live du joueur (`Tone.immediate()`, sans anticipation) partageaient les MÊMES instruments Tone.js (`this.kick`, etc.) dans `AudioEngine`. Une frappe live pouvait arriver à un instant audio légèrement antérieur à une note du modèle déjà programmée en avance sur ce même instrument — la `StateTimeline` interne de Tone exige un ordre strictement croissant, peu importe la source. Le joueur qui tape juste au bon moment est le but même du jeu, donc pas un cas rare : reproduit avec un vrai scénario Playwright (stack trace complète : `MembraneSynth.triggerAttack` → `OmniOscillator.start` → `StateTimeline.add`), 1 fois sur 3 avant correctif. Corrigé en donnant au modèle et au joueur deux jeux d'instruments Tone.js indépendants (`PadVoiceSet`), éliminant la collision par construction. Vérifié : 12 exécutions du scénario reproducteur après correctif, 0 erreur (contre 1 reproduction sur les 3 premières avant), plus un scénario de non-régression confirmant que le score et le rapport par pad restent corrects |

## Écosystème externe et bibliothèques (étude du 13 août 2026)

Issues d'une étude dédiée à la recherche de dépôts communautaires EP-133 et
de bibliothèques techniques génériques, à la demande explicite de
l'utilisateur. Détail complet, sources et justifications dans le nouveau
dossier [`etude/`](../etude/00_INDEX.md) à la racine du dépôt.

| ID | Idée | Statut | Décision ou condition |
|---|---|---|---|
| R-01 | Recouper le layout binaire du pad (26 octets, offsets précis) avec `ep133-ppak/PROTOCOL.md` | EXPÉRIMENTER | Comparaison en lecture seule avec notre décodeur avant toute modification ; voir `etude/01_ECOSYSTEME_EP133.md` |
| R-02 | Réévaluer `kmorrill/ep-series-sysex` (MIT) pour la Phase 5 | EXPÉRIMENTER | Le dépôt propose désormais une écriture réelle vérifiée octet par octet sur firmware 2.5.1 — dépendance stratégique déjà actée en Q-04, état nettement avancé depuis |
| R-03 | Corriger l'hypothèse de fréquence audio native unique (46 875 Hz) | CORRIGÉ | Le firmware 2.5 (juin 2026) ajoute trois taux LO/MID/HI (26 250/32 000/46 875 Hz) ; `wavAnalysis.ts` lit déjà la fréquence réelle sans supposer de valeur fixe, seule la documentation doit être nuancée — voir `etude/05_FIRMWARE_2.5_IMPACT.md` |
| R-04 | Intégrer `vitest` et committer les scénarios Playwright déjà utilisés en pratique | RÉALISÉ (partiel) | 13 août — `vitest.config.ts` + `tests/legacy-checks.test.ts` importent tel quel les 4 scripts `tools/check-*.mjs` (aucune logique dupliquée), `npm run test:unit` ajouté à la chaîne `npm test`. **Vérifié** : `npm test` passe en entier (4 scripts historiques + vitest, 4/4 tests). Scénarios Playwright pas encore committés — voir `docs/SUIVI_IMPLEMENTATION.md` |
| R-05 | Intégrer `vite-plugin-pwa` | RÉALISÉ (partiel) | 13 août — plugin configuré dans `vite.config.ts` (`registerType: 'autoUpdate'`), icônes originales créées (`public/pwa/`), `index.html` complété (favicon, theme-color). **Vérifié** : `npm run build` génère `dist/manifest.webmanifest`, `dist/sw.js` et `dist/registerSW.js`. Reste à confirmer manuellement l'installation réelle dans Chrome/Chromium et le fonctionnement hors ligne, non testé ce 13 août |
| R-06 | Intégrer `wavesurfer.js` pour la forme d'onde/trim | RÉALISÉ | 13 août — `wavesurfer.js` + plugin `regions`, crêtes précalculées par `computeWaveformPeaks` (jamais le décodeur intégré, même précaution que `wavAnalysis.ts`). Typecheck, build (bundle +60 Ko) et vérification visuelle par l'utilisateur dans Chrome (forme d'onde, glisser de région, lecture) — les trois au vert |
| R-07 | Intégrer `@alexanderolsen/libsamplerate-js` pour la conversion vers la fréquence cible | RÉALISÉ (partiel) | 13 août — intégré (`SRC_SINC_BEST_QUALITY`), chargé à la demande (`import()` dynamique, ~2 Mo isolés dans un chunk séparé confirmé au build). Testé en Node réel (WASM) : resampling, identité sans resampling, downmix, trim appliqué avant conversion. **Non vérifié à l'oreille** par un humain — la qualité perçue du resampling reste à confirmer, voir `docs/A_VALIDER_PHYSIQUEMENT.md` |
| R-08 | Étudier `zustand` pour sortir un premier domaine d'état hors d'`App.tsx` | RÉALISÉ (partiel) | 13 août — `src/core/store/languageStore.ts` : premier domaine (langue FR/EN/ES) sorti d'`App.tsx`, `DocumentationPage` lit désormais le magasin directement au lieu de recevoir `language` en prop. Un seul domaine migré sur un très grand nombre d'états encore locaux à `App.tsx` (1556 lignes) — étape suivante à choisir plus tard, pas une décision à prendre seule. **Vérifié** : `npm run typecheck` et `npm run build` passent (un import de type oublié lors du branchement a été trouvé et corrigé au passage) |
| R-09 | Étudier le portage du moteur de clonage (`clone_ep133_readonly.py`) vers TypeScript navigateur (Web MIDI + File System Access API en écriture) | EXPÉRIMENTER | Rendrait `tools/local_clone_bridge.py` inutile ; Web MIDI et l'accès dossier natif sont déjà utilisés séparément, reste à vérifier l'écriture de fichiers volumineux avec reprise |
| R-10 | Ne jamais intégrer la réécriture d'en-tête SKU / DFU (`seajaysec/ep-unity`) | ÉCARTÉ V1 | Risque de brick explicitement documenté par l'auteur et par Teenage Engineering ; confirme la règle déjà actée « DFU/firmware : hors périmètre » |
| R-11 | `zundo` pour étendre Annuler/Rétablir aux scènes/Song (E-25) | EXPÉRIMENTER | Pertinent seulement quand l'état scènes/Song sort d'`App.tsx` vers un store `zustand` dédié (suite de R-08) — pas de dépendance à ajouter avant ce chantier |
| R-12 | `needles`/`@audio/loudness` pour la normalisation LUFS (A-06) | RETENU | Mesure de loudness K-weighted dans le navigateur, hors ligne sur `AudioBuffer` ; Peak reste prioritaire comme déjà décidé, LUFS est un raffinement pour la Phase 4 |
| R-13 | `@audio/beat` (flux spectral) pour la détection de transitoires (A-11) | REPORTÉ | Le flux spectral est déjà l'algorithme par défaut de cette bibliothèque — confirme la piste déjà choisie, ne change pas le statut REPORTÉ (slicing manuel d'abord) |
| R-14 | `wavefile` pour la structure RIFF `LIST`/`INFO` générique, sous le bloc `ITNG` propriétaire EP-133 à coder à la main | RETENU | Économiserait un parseur RIFF bas niveau pour « Génération d'en-tête RIFF EP-133 » (Phase 4) ; ne connaît pas le format EP-133 lui-même |
| R-15 | OPFS comme alternative à la File System Access API pour le clone | ÉCARTÉ | Plus rapide en écriture mais **privé au navigateur, invisible dans l'explorateur de fichiers** — contredit la règle « jamais d'upload, PCM sur le HDD dans un dossier choisi » ; la File System Access API reste le bon choix malgré sa lenteur relative |
| R-16 | Mock `navigator.requestMIDIAccess` via `page.addInitScript()` (Playwright) | RÉALISÉ | 13 août — `playwright.config.ts` + `e2e/midi-connection.spec.ts` : deux scénarios réels (EP-133 détecté vs absent), tous deux vérifiés en exécution réelle (Chromium headless installé sans `--with-deps`, `npm run test:e2e` → 2/2 passés). `npm run build` alimente `vite preview` pour Playwright. Wiré dans `.github/workflows/ci.yml` après le build. Piège trouvé et corrigé au passage : `vite preview` ne répond que sur `::1` par défaut ici, pas `127.0.0.1` — `--host 127.0.0.1` explicite dans la commande du serveur. Ne remplace pas la validation matérielle réelle (mapping SysEx, notes physiques) |

## Règle de suivi

Toute nouvelle étude ajoute ou modifie des lignes ici. Une fonctionnalité ne
passe à **RÉALISÉ** qu'après code, test, documentation et validation. Une idée
ne change de statut que dans un commit qui explique la décision.
