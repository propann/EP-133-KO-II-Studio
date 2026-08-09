# EP-133 Rhythm Hero

Coach de finger-drumming interactif pour le Teenage Engineering EP-133 K.O. II.

L’objectif : apprendre un groove sur une mesure, le rejouer sur la vraie machine, comprendre précisément les erreurs, puis augmenter le tempo sans perdre le plaisir.

## Suite actuelle

- Application React / TypeScript avec moteur Web MIDI et scoring
- Accueil modulaire : jeu, studio complet et gestion des sons
- Player visuel inspiré du K.O. II
- 39 rythmes progressifs, du niveau 1 au niveau 5
- Partition sur une mesure avec le numéro du pad à jouer
- Doigt conseillé pour chaque frappe
- Tempo de 10 % à 150 %
- Sons d’entraînement et VU-mètre réactif
- Studio A–D, séquenceur extensible, piano-roll et sortie MIDI
- Scan en lecture seule des noms, slots et modes de la machine
- Export MIDI et JSON de projet EP-133
- Cahier imprimable généré depuis une source versionnée

## Démarrer l'application

```bash
npm ci
npm run dev
```

Le build de production se génère avec `npm run build`. Le player autonome
historique reste accessible dans `docs/ep133-pad-player.html` pendant la
migration de ses 39 exercices vers l'application React.

Les vérifications des formats de projet se lancent avec :

```bash
npm run test:exports
```

La connexion Web MIDI, le scoring et le mapping officiel des groupes A–D sont
intégrés et ont été validés avec la machine. Les opérations SysEx restent en
lecture seule tant que les protections de transfert ne sont pas finalisées.

## Documentation

- [Feuille de route](docs/ROADMAP.md)
- [Analyse critique du cahier des charges étendu](docs/ANALYSE_ETUDE_CAHIER_CHARGES.md)
- [Registre de toutes les idées et décisions](docs/REGISTRE_IDEES.md)
- [Validation du transport audio et MIDI](docs/VALIDATION_TRANSPORT.md)
- [Plan de découpage de l'interface](docs/DECOUPAGE_INTERFACE.md)
- [Modèle de données du séquenceur](docs/MODELE_DONNEES_PROJET.md)
- [Validation du score et de l'extension](docs/VALIDATION_SCORE_ET_EXTENSION.md)
- [Bibliothèque documentaire et droits](docs/BIBLIOTHEQUE_DOCUMENTAIRE.md)
- [Point d'étape Jeu et Studio](docs/POINT_JEU_ET_STUDIO.md)
- [Validation du Save/Load Studio](docs/VALIDATION_SAVE_LOAD_STUDIO.md)
- [Structure du morceau et Song mode](docs/STRUCTURE_SONG_MODE.md)
- [Chargement du projet 1 de la machine](docs/CHARGEMENT_PROJET_MACHINE.md)
- [Architecture du miroir local de la machine](docs/ARCHITECTURE_MIROIR_MACHINE.md)
- [Clonage complet des projets et samples](docs/CLONAGE_COMPLET_MACHINE.md)
- [Banque de samples machine dans le Studio](docs/BANQUE_SAMPLES_STUDIO.md)
- [Validation du premier clone matériel](docs/VALIDATION_CLONE_REEL.md)
- [Gestion des fichiers et des sons](docs/GESTION_FICHIERS_ET_SONS.md)
- [Décision sur les formats de projet](docs/DECISION_FORMATS_PROJET.md)
- [Vision future OP-1](docs/VISION_OP1.md)
- [Journal de suivi des étapes](docs/SUIVI_IMPLEMENTATION.md)
- [Architecture cible](docs/ARCHITECTURE.md)
- [Mise en route Windows](docs/MISE_EN_ROUTE_WINDOWS.md)
- [Mise en route Linux — chemin principal](docs/MISE_EN_ROUTE_LINUX.md)
- [Connexion et calibration MIDI du EP-133](docs/CONNEXION_ET_CALIBRATION_MIDI.md)
- [Lancement local Windows / Raspberry Pi](docs/LANCEMENT_LOCAL.md)
- [État du projet](docs/ETAT_DU_PROJET.md)
- [Parcours des 39 exercices](exercises/PARCOURS_EXERCICES_V1.md)
- [Catalogue machine des exercices](exercises/catalogue-exercices-v1.json)
- [Atlas de finger-drumming](handbook/EP133_ATLAS_FINGER_DRUMMING.md)

## Organisation

- `src/` : application React et moteurs audio, MIDI et scoring
- `public/` : exercices de l'application et sources MIDI
- `docs/` : documentation et player autonome historique
- `exercises/` : exercices en JSON
- `handbook/` : partitions et cahier
- `tools/` : générateurs et vérifications

Le contexte de fusion et les prochaines priorités sont consignés dans
[`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md).

## Déploiement

Chaque push sur `main` déclenche le workflow GitHub Pages. Dans les réglages du
dépôt, choisir **Settings → Pages → Source: GitHub Actions** lors de la première
mise en service.

## Licence

Code du projet : MIT, sauf dépendance future précisant autre chose.

Teenage Engineering, EP-133 et K.O. II sont des marques de leurs propriétaires. Projet communautaire indépendant.
