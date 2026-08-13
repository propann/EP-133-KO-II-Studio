# État du projet

> Mise à jour consolidée : **13 août 2026**. Remplace la version précédente
> (datée du 9 août), restée figée pendant que le projet avançait — ce
> document racontait plus l'état de la première semaine que celui
> d'aujourd'hui. Les rapports de session détaillés restent dans
> `RAPPORT_SESSION_2026-08-10.md`, `-11.md` et `-12.md` ; le journal pas à
> pas dans `SUIVI_IMPLEMENTATION.md` ; la feuille de route complète dans
> `ROADMAP.md` ; le registre de toutes les idées (retenues, écartées,
> reportées) dans `REGISTRE_IDEES.md`.

## En une phrase

Le Studio ouvre, lit, édite et rejoue de vrais projets EP-133 hors ligne,
clone la machine sans risque (lecture seule), et sait maintenant parler à
l'EP-133 en MIDI temps réel — mais ne sait **encore rien écrire** sur la
machine elle-même (aucun protocole d'écriture SysEx n'est activé).

## Ce qui marche aujourd'hui, validé sur machine réelle

- **MIDI temps réel** : détection automatique de l'EP-133 (filtré pour
  ignorer `Midi Through`), frappes de pads 36–83 → grille A–D, boutons
  physiques A–D détectés par SysEx propriétaire, PANIC sur 16 canaux. Le
  diagnostic « NON CONNECTÉ persistant » est clos : c'est une question
  d'autorisation Chrome (`midi` + `midi-sysex`), pas un bug de l'app.
- **Lecture de projets réels** : `.pak/.ppak` (ZIP + TAR) décodé en lecture
  seule — 48 pads, patterns 96 PPQN, scènes, tempo, tout validé sur un vrai
  projet. Le Studio ouvre directement le projet 1 réel de la machine.
- **Clonage complet** : moteur Python (`tools/clone_ep133_readonly.py`) +
  pont HTTP local, raccordé au bouton `CLONER LA MACHINE`. Un vrai clone
  validé : 9 projets, 527 sons, 56,21 Mo, 536 hashes conformes. Synchronisation
  incrémentale validée sur un second passage (30,7 s, zéro téléchargement).
- **Studio d'édition** : 4 groupes A–D, 12 pads/groupe, piano-roll KEYS,
  grille rythmique avec vélocité (Maj+molette), gate/durée (Alt+molette),
  multi-sélection (Ctrl/Cmd+clic), nudge (flèches), Annuler/Rétablir sur le
  pattern actif. Hiérarchie native complète : patterns 01–99, scènes
  S.01–S.99, Song Positions L.01–L.99 (Song Arranger dédié).
- **Save/Load** : cycle complet Nouveau/Sauvegarder/Ouvrir/Renommer/
  Dupliquer/Archiver/Supprimer sur `ep.project.v1`, import/export MIDI,
  import `.pak/.ppak` en lecture seule, 5 démos versionnées.
- **Sons & Transfert** : bibliothèque perso + banque machine côte à côte,
  glisser-déposer dans les deux sens, lecture PCM locale hors ligne, fiche
  audio déterministe (poids/durée/fréquence/écrêtage lue dans l'en-tête RIFF,
  jamais rééchantillonnée par le navigateur).
- **Rhythm Hero** (module pédagogique inclus) : 39 styles, dont 10 avec leurs
  5 niveaux écrits à la main (les 29 autres restent en génération
  procédurale) ; rapport de progression par pad avec détection de
  « pad confondu » ; parcours 7/30 jours avec répétition sur MISS élevé.
- **FR/EN/ES** : accueil et centre documentaire traduits, choix mémorisé.
  Les autres modules restent en français (suivi dans `SUIVI_TRADUCTIONS.md`).

## Ce qui est expérimental ou partiel

- **Écriture matérielle : rien n'est activé.** Ni `.ppak`, ni sample, ni
  affectation son→pad. `SYNCHRONISER` prépare un plan local, jamais un envoi
  à la machine. C'est la limite structurante du produit aujourd'hui.
- **Time Machine** : chronologie et comparaison des clones successifs, oui ;
  restauration (locale ou matérielle), pas commencée.
- **Piano-roll KEYS** : hauteurs éditables, articulations pas encore.
- **Préparateur audio** (Phase 4) : analyse WAV déterministe, forme d'onde
  et trim non destructif (`WaveformTrim`, vérifié dans Chrome), auto-trim
  par détection de silence, gain de normalisation Peak suggéré, et
  désormais une vraie **conversion vers la fréquence cible EP-133**
  (LO/MID/HI selon le firmware 2.5, resampling `libsamplerate-js`, dither
  TPDF, pré-écoute avant/après) — appliquée à la sélection de trim, jamais
  au fichier entier, avec le **poids exact affiché en direct** sur chaque
  bouton LO/MID/HI pendant l'ajustement du trim, comparé à l'occupation et
  la capacité réelles de la machine si elle a déjà été scannée (« TIENT »
  / « NE TIENT PAS »), et un **fondu linéaire en entrée/sortie** (durées en
  ms, appliqué après resampling), plus une section **hauteur racine/BPM/
  mode ONE-KEYS-LEGATO** en préparation (pas encore écrite dans un en-tête
  RIFF réel — le format exact de ce bloc n'a jamais été recoupé avec du
  matériel par ce projet, écrire au hasard serait pire que rien). Le
  module de conversion (~2 Mo, WASM) ne charge qu'au premier clic. **Rien
  depuis l'auto-trim n'a encore été revu à l'œil ou à l'oreille** — voir
  `docs/A_VALIDER_PHYSIQUEMENT.md`. Écriture de slot reste à faire —
  bloquée par la Phase 5 (aucun protocole d'écriture SysEx dans ce projet).
- **`App.tsx`** : la vue est découpée (pages + composants, ~1 720 lignes
  sorties), l'état ne l'est presque pas encore (~1 550 lignes, 60 `useState`
  restants). Un premier domaine — la langue — est sorti vers un magasin
  `zustand` le 13 août, comme preuve de méthode plus que comme solution.

## Écosystème externe et outillage (nouveau, 13 août)

Une étude dédiée (dossier [`etude/`](../etude/00_INDEX.md)) a cartographié
les dépôts communautaires EP-133/EP-40/EP-1320 et les bibliothèques
techniques réutilisables. Trois découvertes marquantes :

- `kmorrill/ep-series-sysex` (MIT) sait désormais **écrire** sur l'appareil
  avec vérification octet par octet, validé sur firmware 2.5.1 — un socle
  bien plus avancé que prévu pour la future Phase 5.
- Le **firmware EP-133 2.5** (juin 2026) ajoute trois taux d'échantillonnage
  (LO/MID/HI), ce qui corrige notre ancienne hypothèse d'une fréquence
  native unique à 46 875 Hz.
- Le pont Python local (`tools/local_clone_bridge.py`) pourrait devenir
  inutile : ni le MIDI (déjà natif au navigateur) ni l'écriture disque (File
  System Access API déjà utilisée) n'exigent vraiment Python — un portage
  TypeScript reste à tenter.

Outillage intégré et **vérifié par un vrai build/test**, pas seulement
recommandé :

- `vitest` enveloppe les 4 scripts historiques (`tools/check-*.mjs`) sans
  dupliquer leur logique — tourne même sur un Node plus ancien que la
  version 22 exigée par `--experimental-strip-types`.
- `vite-plugin-pwa` : le Studio est maintenant installable hors ligne
  (manifeste, service worker, icônes originales).
- `zustand` : premier magasin d'état partagé (langue FR/EN/ES).
- **Playwright** : premier vrai test E2E (`e2e/midi-connection.spec.ts`),
  Web MIDI simulé pour vérifier l'interface de connexion sans machine ni
  extension navigateur — câblé en CI après le build.

Détail complet, licences et ce qui a été délibérément écarté (ex. OPFS pour
le clone, casse une règle produit ; tout ce qui touche au DFU/firmware) dans
`etude/04_RECOMMANDATIONS_INTEGRATION.md` et `REGISTRE_IDEES.md` (R-01 à
R-16).

## Qualité et CI

- CI qualité sur chaque push/PR : typecheck, les 4 scripts historiques,
  `vitest`, build, **et maintenant l'E2E Playwright** (`.github/workflows/ci.yml`).
- Dépendances pinnées (`^`, plus de `latest`), lockfile vérifié avec `npm ci`.
- Toujours aucun test d'intégration React au-delà de l'écran d'accueil — la
  pyramide de tests a ses trois niveaux amorcés, pas encore généralisée.

## Priorités actuelles

Dans l'ordre où `ROADMAP.md` et `PROJECT_CONTEXT.md` les posent aujourd'hui :

1. **Phase 5 — `.ppak`** : encore aucune case cochée, c'est le vrai verrou
   avant toute écriture matérielle. Réévaluer `kmorrill/ep-series-sysex` en
   premier plutôt que de repartir de zéro.
2. **Phase 4 — préparateur audio** : forme d'onde, conversion, jauge mémoire.
3. **Contenu pédagogique** : étendre les 5 niveaux aux 29 styles restants
   (10/39 faits).
4. **Suite du découpage d'état d'`App.tsx`**, un domaine à la fois.
5. **Bibliothèque unifiée** exercices/projets, banques sonores complètes
   (tags, favoris, kit de secours).
6. **Archiver `Pad-Hero`** sur GitHub — action externe, toujours en attente
   d'accord explicite.

## Ce qui ne changera pas

Lecture seule par défaut sur la machine, aucune écriture sans checkpoint et
confirmation explicite, aucun sample propriétaire versionné, aucune fonction
DFU/firmware dans l'interface. Ces règles n'ont pas bougé depuis le début du
projet et ne sont pas remises en question par l'étude du 13 août.
