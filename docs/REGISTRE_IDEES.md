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
| F-01 | Détection automatique et Web MIDI | RÉALISÉ | Connexion entrées/sorties déjà disponible |
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
| A-03 | Conversion 44,1 kHz | CORRIGÉ | Cible native observée : PCM 16 bits à 46 875 Hz |
| A-04 | Dither TPDF | RETENU | Uniquement lors d'une réduction effective de profondeur |
| A-05 | Mono, stéréo, gauche ou droite | RETENU | Inclure contrôle de phase et pré-écoute |
| A-06 | Normalisation Peak/RMS/LUFS | RETENU | Peak d'abord ; LUFS utile surtout aux contenus longs |
| A-07 | Limiteur de sécurité | RETENU | Option explicite et comparaison avant/après |
| A-08 | Auto-trim avec seuil | RETENU | Seuil, garde d'attaque et relâchement configurables |
| A-09 | Forme d'onde et trim au sample | RETENU | Édition non destructive avant conversion |
| A-10 | Slicing sur grille/nombre fixe | RETENU | Manuel avant les algorithmes automatiques |
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
| E-05 | Gate time par poignée | RETENU | Utile surtout en KEY/LEGATO |
| E-06 | Ratcheting/Note Repeat | EXPÉRIMENTER | Représenter d'abord comme notes répétées ; champ natif dédié non prouvé |
| E-07 | Clic gauche pour créer | RETENU | Seulement dans la grille active |
| E-08 | Clic droit pour supprimer | EXPÉRIMENTER | Neutraliser le menu contextuel uniquement dans l'éditeur et fournir une alternative clavier |
| E-09 | Double-clic créer/supprimer | ÉCARTÉ V1 | Ambigu dans l'étude et conflictuel avec le clic simple |
| E-10 | Alt + glisser sans grille | RETENU | Déplacement et durée au tick près |
| E-11 | Pan par clic molette | RETENU | Ajouter aussi barres de défilement et gestes trackpad |
| E-12 | Ctrl + molette zoom horizontal | RETENU | Zoom centré sur le pointeur |
| E-13 | Alt + molette zoom vertical | EXPÉRIMENTER | Conflit E-16 levé (vélocité passée sur Shift, pas Alt) ; reste à faire |
| E-14 | Shift + molette défilement horizontal | CORRIGÉ | Le défilement horizontal utilise la molette seule (sans modificateur) depuis le début ; Shift+molette est réservé à la vélocité depuis le 12 août — ce document décrivait une intention jamais implémentée telle quelle |
| E-15 | Sélection rectangulaire | RETENU | Ctrl/Cmd + glisser, avec alternative tactile future |
| E-16 | Alt + molette vélocité | RÉALISÉ | Implémenté avec Shift, pas Alt (12 août) : Maj+molette sur un pas rempli, delta ±8, clampé 1–127, retour opacité+infobulle, écouteur natif non passif (le `onWheel` React délégué est passif et avale `preventDefault()` en silence — un vrai test Playwright l'a révélé : le second cran d'un même geste scrollait la grille au lieu d'ajuster la note). Couvre la grille rythmique ET le piano-roll KEYS note à note (étendu le même jour, même mécanisme réutilisé directement) |
| E-17 | Dupliquer Ctrl/Cmd+D | RETENU | Duplication à la suite avec Annuler |
| E-18 | Flèches : déplacer/transposer | RETENU | Seulement si la grille possède le focus |
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
| P-11 | Pads PC ↔ machine | RÉALISÉ | MIDI OUT du studio et MIDI IN déjà disponibles |
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
| Q-03 | Pyramide de tests (unitaire/intégration/E2E) | RETENU | Suite actuelle limitée à 3 scripts ciblés (moteur, transport, exports) ; Playwright déjà utilisé en pratique pour vérifier visuellement chaque changement, mais hors suite committée — à formaliser |
| Q-04 | Adaptateur versionné autour d'`ep-series-sysex` (MIT) | EXPÉRIMENTER | Éviter de réimplémenter seul le protocole d'écriture SysEx ; dépendance stratégique externe à évaluer avant la Phase 5 |
| Q-05 | Positionnement « Learning & Project OS » (Coach / Composer / Time Machine / Open Interop / Local First) | RETENU | Cadre de différenciation face à EP-PatchStudio (menace critique identifiée) ; à formaliser dans la doc produit et la page d'accueil, pas de changement de code requis |
| Q-06 | Écran diagnostic MIDI complet (latence, jitter, port filtré, dernière note) | RETENU | Symptôme réel déjà observé cette session (« NON CONNECTÉ » persistant côté utilisateur malgré un port libre) — pas seulement une recommandation théorique. Cause du symptôme confirmée le 12 août avec la vraie machine branchée (autorisation SysEx du navigateur, pas un bug — voir CONNEXION_ET_CALIBRATION_MIDI.md) ; l'écran diagnostic complet lui-même reste à construire |
| Q-07 | Rapport de progression par pad après une session Rhythm Hero | RÉALISÉ | 12 août — pads triés du plus fauté au moins fauté, écart signé par pad, conseil de tempo ; bug réel trouvé et corrigé au passage (setPlayerNotes imbriqué dans l'updater de setScore, doublé par StrictMode). « Pad confondu » (12 août, plus tard le même jour) : `scoreHit` détecte, sur un MISS, une cible non jouée sur un AUTRE pad dans la fenêtre GOOD ; `buildPadReport` remonte le pad le plus souvent visé par erreur, signalé seulement à partir de 2 occurrences (bruit sinon) ; affiché « ↷ SOUVENT CONFONDU AVEC … » dans le rapport. Comparaison de métadonnées de timing seulement, pas une détection de posture/doigté |
| Q-08 | Onboarding « Découvrir sans machine » avec projet exemple | REPORTÉ | Utile pour l'adoption, mais la Phase 1 (socle) doit rester prioritaire |
| Q-09 | Terminologie rassurante (« copie de sécurité », « plan de modifications » plutôt que « synchroniser ») | EXPÉRIMENTER | Déjà partiellement appliqué (SYNCHRONISER décrit précisément ce qu'il fait dans Sons & Transfert) ; à généraliser à toute l'interface |
| Q-10 | Audit du cycle Save→quitter→rouvrir | RÉALISÉ | 12 août — un vrai bug trouvé et corrigé : `note ?? 60` à l'export corrompait tout pad-trigger en note MIDI fixe après un aller-retour Sauvegarder→Ouvrir ; voir VALIDATION_SAVE_LOAD_STUDIO.md |
| Q-11 | Conversion Projet → Exercice (Studio → Rhythm Hero) | RÉALISÉ | 12 août — FICHIER › Envoyer le pattern vers Rhythm Hero, réutilise editorExercise()/saveEditorExercise déjà en place ; un seul pattern à la fois, pas encore toute une scène/Song ni de sélection de mesures |
| Q-12 | Édition expressive : vélocité, gate, micro-timing, multi-sélection, nudge | RÉALISÉ (partiel) | 12 août — vélocité d'un pas éditable (Maj+molette, voir E-16) dans la grille rythmique ET le piano-roll KEYS (étendu le même jour, même mécanisme d'écouteur natif non passif) ; gate/durée, micro-timing hors grille, multi-sélection et nudge restent à faire |
| Q-13 | Bibliothèque unifiée : recherche, tags, miniatures, dépendances | RÉALISÉ (partiel) | 12 août — recherche par titre et métadonnées (BPM, nombre de patterns non vides, date) dans « Ouvrir… » (`summarizeStudioProject`), triée par date de modification. Détection des dépendances manquantes ajoutée le même jour : `findMissingDependencies` (device.ts) compare les affectations son → pad enregistrées dans un projet à l'index sonore actuellement scanné, avertissement affiché à l'ouverture s'ils divergent (testé avec les 32 vrais pads de la machine réellement branchée). Ne couvre que les projets Studio (pas les exercices Rhythm Hero ni les clones machine), et tags/miniatures restent à construire |
| Q-14 | Parcours 7 jours et 30 jours avec répétition des difficultés | RÉALISÉ | 12 août — `practicePlan.ts` : journal daté des séances (séparé du cumul de `playerProfile.ts`), rotation des dix styles dédiés avec un cran de difficulté par tour complet, répétition automatique du jour précédent si MISS > 25 % (seuil repris d'`adviseTempo`) ; section PARCOURS dans la fiche personnage, bouton COMMENCER qui charge directement le style/niveau du jour dans le jeu ; parcours recalculé à chaque consultation, pas un calendrier figé |
| Q-15 | P2 item 2 : préparer le WAV de façon déterministe et rapporter poids, durée, fréquence et saturation | RÉALISÉ | 12 août — `wavAnalysis.ts` : en-tête RIFF/fmt lu à la main (pas `decodeAudioData()`, qui rééchantillonne parfois), PCM 8/16/24/32 bits et float 32 bits, écrêtage détecté sur le code numérique exact ; fiche audio affichée à l'écoute d'un son perso dans Sons & Transfert. Les items 1/3/4/5 du plan P2 touchent à une écriture matérielle réelle et restent hors de portée du travail logiciel seul (consigne stricte de lecture seule sur la machine physique) — non commencés, pas oubliés |
| Q-16 | P2 item 5 : Time Machine locale avant toute restauration matérielle | RÉALISÉ (partiel) | 12 août — voir F-16. Vrai bug corrigé : `history` existait dans le manifeste depuis le début mais était toujours réécrasé à une seule entrée à chaque SCAN/CLONE au lieu de s'accumuler ; `createDeviceClone` lit désormais le manifeste précédent et ajoute un point daté avec comparaison (sons/Mo/projet). Le dialogue CLONER affiche la vraie chronologie à la place de la mention statique « Prévu : … » qui y était. **Deuxième bug trouvé en revérifiant ce chantier le même jour** : un manifeste écrit par le code d'avant ce correctif n'a que `{ createdAt, label }` par entrée — comparer un nouveau point à une ancienne entrée sans `soundCount`/`usedBytes` produisait `NaN - undefined = NaN`, affiché littéralement comme « NaN son » dans l'étiquette. Corrigé par un garde-fou `Number.isFinite()` par champ dans `describeCloneDelta`, avec un test de migration dédié (`tools/check-project-exports.mjs`) reproduisant un ancien manifeste puis vérifiant l'absence de `NaN`. Restauration (locale ou matérielle) non commencée — nécessiterait un stockage versionné réel des PCM, pas seulement des métadonnées |
| Q-17 | Erreur console Tone.js « time must be greater than or equal to the last scheduled time » (signalée incidemment le 12 août pendant la vérification du parcours) | RÉALISÉ | 12 août — vrai bug de conception, pas un flake : le modèle programmé (`Tone.Transport.schedule`, avec anticipation) et les frappes live du joueur (`Tone.immediate()`, sans anticipation) partageaient les MÊMES instruments Tone.js (`this.kick`, etc.) dans `AudioEngine`. Une frappe live pouvait arriver à un instant audio légèrement antérieur à une note du modèle déjà programmée en avance sur ce même instrument — la `StateTimeline` interne de Tone exige un ordre strictement croissant, peu importe la source. Le joueur qui tape juste au bon moment est le but même du jeu, donc pas un cas rare : reproduit avec un vrai scénario Playwright (stack trace complète : `MembraneSynth.triggerAttack` → `OmniOscillator.start` → `StateTimeline.add`), 1 fois sur 3 avant correctif. Corrigé en donnant au modèle et au joueur deux jeux d'instruments Tone.js indépendants (`PadVoiceSet`), éliminant la collision par construction. Vérifié : 12 exécutions du scénario reproducteur après correctif, 0 erreur (contre 1 reproduction sur les 3 premières avant), plus un scénario de non-régression confirmant que le score et le rapport par pad restent corrects |

## Règle de suivi

Toute nouvelle étude ajoute ou modifie des lignes ici. Une fonctionnalité ne
passe à **RÉALISÉ** qu'après code, test, documentation et validation. Une idée
ne change de statut que dans un commit qui explique la décision.
