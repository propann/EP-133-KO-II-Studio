# Étude — écosystème externe et outillage EP-133 KO II Studio

Date de l'étude : **13 août 2026**.
Auteur : session d'analyse dédiée, sur demande explicite d'un audit externe
complet (dépôts communautaires + bibliothèques techniques) avant la suite du
développement.

## Pourquoi ce dossier existe

Le dépôt possède déjà une analyse solide de l'écosystème EP-133 dans
`docs/REFERENCE_SYSEX_EP133.md`, `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md` et
`docs/REGISTRE_IDEES.md`. Cette étude ne les remplace pas : elle les
**complète** avec une recherche fraîche du 13 août 2026, centrée sur trois
questions concrètes posées par l'utilisateur :

1. Quels dépôts publics (EP-133 et au-delà) contiennent des informations ou
   du code réutilisables pour accélérer notre studio ?
2. Quelles bibliothèques techniques matures pourraient remplacer ou
   compléter nos implémentations « maison » (TAR, MIDI, waveform, audio,
   pont local, état applicatif, tests) ?
3. Qu'est-ce qui a changé récemment côté machine (firmware) ou côté
   communauté qui doit corriger nos hypothèses actuelles ?

## Comment lire ce dossier

| Fichier | Contenu |
|---|---|
| [01_ECOSYSTEME_EP133.md](01_ECOSYSTEME_EP133.md) | Tous les dépôts et ressources spécifiques à l'EP-133/EP-40/EP-1320 trouvés, avec licence, état, ce qu'ils apportent et niveau de risque |
| [02_BIBLIOTHEQUES_TECHNIQUES.md](02_BIBLIOTHEQUES_TECHNIQUES.md) | Bibliothèques génériques (MIDI, audio, TAR/ZIP, waveform, état React, tests, PWA/desktop) comparées à notre code actuel |
| [03_FORMATS_DAW_ET_EXPORT.md](03_FORMATS_DAW_ET_EXPORT.md) | DAWproject, REAPER RPP, Ableton ALS — formats, bibliothèques existantes, contraintes de licence |
| [04_RECOMMANDATIONS_INTEGRATION.md](04_RECOMMANDATIONS_INTEGRATION.md) | Synthèse actionnable, classée par priorité, avec ce qu'il ne faut jamais intégrer |
| [05_FIRMWARE_2.5_IMPACT.md](05_FIRMWARE_2.5_IMPACT.md) | Nouveautés du firmware EP-133 2.5 (juin 2026) et corrections nécessaires à nos documents existants |

## Les cinq découvertes les plus importantes

1. **`kmorrill/ep-series-sysex` (MIT) a nettement progressé** : le dépôt
   propose désormais une écriture réelle vers l'appareil avec vérification
   octet par octet, validée sur firmware 2.5.1 — exactement ce que la Phase 5
   de notre feuille de route (compilation `.ppak`, écriture matérielle) doit
   encore construire. Voir [01](01_ECOSYSTEME_EP133.md#kmorrillep-series-sysex).
2. **`ZacharySBrown/ep133-ppak` documente des offsets binaires précis** pour
   l'enregistrement de pad (26 octets, offsets exacts) que nos propres
   documents laissaient approximatifs (« 26 ou 27 octets »). À recouper avec
   notre décodeur. Voir [01](01_ECOSYSTEME_EP133.md#zacharysbrownep133-ppak).
3. **Le firmware 2.5 (juin 2026) introduit trois taux d'échantillonnage**
   (LO 26 250 Hz, MID 32 000 Hz, HI 46 875 Hz), ce qui remet en cause notre
   hypothèse d'une fréquence native unique. Voir
   [05](05_FIRMWARE_2.5_IMPACT.md).
4. **`phones24/ep133-export-to-daw` est écrit en TypeScript** et exporte déjà
   depuis EP-133/EP-1320/EP-40 vers Ableton, DAWproject, REAPER et MIDI — la
   référence d'architecture la plus proche de notre propre stack, malgré sa
   licence AGPL-3.0 qui interdit la reprise de code. Voir
   [03](03_FORMATS_DAW_ET_EXPORT.md).
5. **`tools/local_clone_bridge.py` pourrait devenir inutile** : son seul rôle
   est de lancer le moteur Python de clonage et d'exposer sa progression en
   HTTP local ; ni le MIDI (déjà en Web MIDI natif) ni l'écriture disque
   (File System Access API déjà utilisée) n'exigent Python en théorie. Voir
   [04](04_RECOMMANDATIONS_INTEGRATION.md#supprimer-la-dépendance-python-du-pont-local).

## Deuxième vague (13 août, soir)

Poursuite de la recherche à la demande de l'utilisateur, une fois la
première vague partiellement intégrée au code (`vitest`, `vite-plugin-pwa`,
pilote `zustand` — voir `docs/SUIVI_IMPLEMENTATION.md`). Six nouvelles
trouvailles ciblées, ajoutées dans
[02_BIBLIOTHEQUES_TECHNIQUES.md](02_BIBLIOTHEQUES_TECHNIQUES.md#deuxième-vague-de-recherche-13-août-soir)
et [01_ECOSYSTEME_EP133.md](01_ECOSYSTEME_EP133.md#polyend-tracker--écosystème-comparable-mais-bien-plus-ouvert-deuxième-vague-13-août-soir)
(R-11 à R-16 dans `docs/REGISTRE_IDEES.md`) :

- `zundo` pour étendre Annuler/Rétablir aux scènes/Song, une fois qu'elles
  auront elles aussi leur propre store `zustand`.
- `needles`/`@audio/loudness` pour la normalisation LUFS (A-06).
- `@audio/beat` confirme, sans le remettre en cause, le choix déjà fait pour
  A-11 (flux spectral).
- `wavefile` pour la structure RIFF générique, sous le bloc `ITNG`
  propriétaire EP-133 encore à coder à la main.
- **OPFS écarté** pour le clone : plus rapide que la File System Access API,
  mais invisible dans l'explorateur de fichiers — contredit une règle
  produit explicite (« jamais d'upload, dossier choisi par l'utilisateur »).
- Mock `navigator.requestMIDIAccess` via `page.addInitScript()` (Playwright)
  pour enfin committer des tests d'interface MIDI en CI headless.
- `polyend/tracker-lib` : le fabricant Polyend publie lui-même un SDK
  TypeScript officiel pour son Tracker — un précédent concret pour la
  demande d'ouverture du fil OP Forums côté Teenage Engineering.

## Ce que ce dossier n'est pas

- Une autorisation d'écrire sur la machine réelle : toutes les règles de
  `PROJECT_CONTEXT.md` et `docs/ROADMAP.md` (lecture seule par défaut,
  checkpoint, confirmation, relecture) restent en vigueur.
- Une décision déjà actée : chaque recommandation reste à valider par un
  vrai test avant d'entrer dans `docs/REGISTRE_IDEES.md` au statut RÉALISÉ.
- Un remplacement de `docs/REFERENCE_SYSEX_EP133.md` : ce document reste la
  référence protocole ; cette étude y renvoie et propose des corrections
  ponctuelles, pas une réécriture.

## Suivi

Conformément à la règle de `docs/REGISTRE_IDEES.md` (« Toute nouvelle étude
ajoute ou modifie des lignes ici »), les décisions issues de ce dossier sont
tracées dans une nouvelle section **« Écosystème externe et bibliothèques
(étude du 13 août 2026) »** de ce registre, avec des identifiants `R-xx`.
