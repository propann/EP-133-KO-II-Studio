# Recommandations d'intégration — synthèse actionnable

> Classement par priorité. Chaque ligne renvoie vers le détail dans
> [01](01_ECOSYSTEME_EP133.md), [02](02_BIBLIOTHEQUES_TECHNIQUES.md) ou
> [03](03_FORMATS_DAW_ET_EXPORT.md). Rien ici n'est appliqué automatiquement
> au code : conformément aux règles du projet, chaque item passe par un test
> réel avant de changer de statut dans `docs/REGISTRE_IDEES.md`.

## P0 — fort impact, faible risque, comble une dette déjà identifiée par l'équipe

| # | Action | Pourquoi maintenant |
|---|---|---|
| 1 | Intégrer `vitest` et committer les scénarios Playwright déjà utilisés en pratique | Répond directement à Q-03 (« à formaliser »), zéro risque produit, gain de fiabilité immédiat |
| 2 | Intégrer `vite-plugin-pwa` | Réalise X-12 (« RETENU », jamais commencé) — l'outil existe déjà pour ça |
| 3 | Recouper le layout binaire du pad (26 octets, offsets précis) documenté par `ep133-ppak/PROTOCOL.md` avec notre décodeur `importers.ts` | Corrige une zone actuellement approximative (« 26 ou 27 octets ») sans risque : lecture seule, comparaison, pas d'écriture |
| 4 | Corriger la documentation de la fréquence audio native (LO/MID/HI, firmware 2.5) dans `docs/REFERENCE_SYSEX_EP133.md` | Une hypothèse fausse documentée est pire qu'une case vide — risque de futur bug de conversion si non corrigé avant la Phase 4 |
| 5 | Étudier en détail `kmorrill/ep-series-sysex` (écriture vérifiée octet à octet, firmware 2.5.1) comme base de la Phase 5 | C'est la dépendance stratégique déjà actée (Q-04) ; son état a nettement progressé et mérite une réévaluation prioritaire avant de commencer à coder un encodeur `.ppak` de zéro |

## P1 — impact réel, nécessite un vrai chantier avant d'être RÉALISÉ

| # | Action | Pourquoi |
|---|---|---|
| 6 | Étudier `zustand` pour sortir un premier domaine d'état hors d'`App.tsx` | Priorité n°1 de la Roadmap Phase 1, jamais commencée ; migration incrémentale possible sans grosse réécriture |
| 7 | Intégrer `wavesurfer.js` pour la forme d'onde/trim | Roadmap Phase 4, jamais commencée ; régions natives couvrent A-09/A-10 directement |
| 8 | Intégrer `@alexanderolsen/libsamplerate-js` pour la conversion précise vers 46 875/32 000/26 250 Hz | Corrige/complète A-03 à la lumière du firmware 2.5 ; API compatible avec une fréquence cible paramétrable |
| 9 | Étudier `phones24/ep133-export-to-daw` comme référence d'architecture (pas de code, AGPL) pour X-02/X-03 | Même stack (TypeScript), preuve de faisabilité directe sur EP-133/EP-1320/EP-40 |
| 10 | <a name="supprimer-la-dépendance-python-du-pont-local"></a>Étudier le portage du moteur de clonage (`clone_ep133_readonly.py`) vers TypeScript navigateur (Web MIDI + File System Access API écriture) | Rendrait `tools/local_clone_bridge.py` inutile, réglant d'un coup l'item Roadmap Phase 3 « installer le pont comme service utilisateur » en le supprimant plutôt qu'en le finissant |

## P2 — veille, expérimental, ou à ne déclencher que sur un besoin confirmé

| # | Action | Pourquoi différer |
|---|---|---|
| 11 | Étudier `DannyDesert/EP133-skill` (MIT) comme seconde référence `.ppak` | Utile pour croiser, mais redondant avec #5 tant que la Phase 5 n'est pas commencée |
| 12 | Surveiller `szeraf/ep_1320_sample_tool` et le fil OP Forums sur l'EP-1320 | Expansion multi-appareils hors périmètre actuel, cohérent avec le déclencheur déjà posé dans `docs/VISION_OP1.md` (attendre une vraie demande) |
| 13 | Intégrer `ffmpeg.wasm` pour l'import MP3/FLAC/OGG (A-02) | Dépendance lourde (Mo de WASM) à n'ajouter qu'au moment réel de traiter A-02, pas en anticipation |
| 14 | Explorer Tauri 2 (`tauri-plugin-serialplugin`) | Rester `EXPÉRIMENTER` (X-06) — à retenter seulement si #10 échoue et qu'un vrai besoin d'accès disque natif apparaît |
| 15 | Étudier `KnobKraft Orm` comme patron d'architecture multi-appareils | Pertinent seulement quand un deuxième appareil réel (EP-40, EP-1320) rejoint réellement le périmètre |

## À ne jamais intégrer

- **`seajaysec/ep-unity`** : réécriture d'en-tête SKU et flash DFU. Risque de
  brick explicitement documenté par l'auteur et par Teenage Engineering.
  Aucune fonctionnalité de ce type ne doit apparaître dans l'interface,
  cohérent avec la règle déjà actée « DFU/firmware : hors périmètre ».
- **Code sous AGPL-3.0** (`phones24/ep133-export-to-daw`, `openDAW`) : lecture
  et inspiration autorisées, copie de code interdite sans assumer les
  obligations de la licence — règle déjà actée dans
  `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md`, confirmée ici pour un second
  projet (`openDAW`).
- **Tout fichier `.syx` communautaire envoyé tel quel** à la machine — règle
  déjà actée, reconfirmée : ces fichiers contiennent des slots et données
  fixes qui peuvent écraser du contenu réel.

## Comment faire avancer ce classement

Chaque item P0/P1 qui passe réellement en code doit :

1. suivre la procédure de confiance déjà décrite dans
   `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md` (« lecture d'une archive réelle,
   conservation des octets inconnus, test aller-retour, comparaison
   binaire, génération sur une copie, essai dans un projet brouillon ») pour
   tout ce qui touche au format machine ;
2. ajouter une entrée dans `docs/REGISTRE_IDEES.md` (nouvelle section
   « Écosystème externe et bibliothèques » ajoutée par cette étude, voir
   ci-dessous) avec un statut qui évolue seulement après test réel ;
3. être documenté dans `docs/SUIVI_IMPLEMENTATION.md` comme toute autre
   étape, une fois livré.

## Traçabilité

Cette synthèse a été reportée dans `docs/REGISTRE_IDEES.md` sous une
nouvelle section « Écosystème externe et bibliothèques (étude du 13 août
2026) », avec des identifiants `R-01` à `R-10`, conformément à la règle de
suivi du registre.
