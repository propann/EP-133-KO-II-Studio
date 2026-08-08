# EP-133 Rhythm Hero

Coach de finger-drumming interactif pour le Teenage Engineering EP-133 K.O. II.

L’objectif : apprendre un groove sur une mesure, le rejouer sur la vraie machine, comprendre précisément les erreurs, puis augmenter le tempo sans perdre le plaisir.

## État actuel

- Player visuel inspiré du K.O. II
- 39 rythmes progressifs, du niveau 1 au niveau 5
- Partition sur une mesure avec le numéro du pad à jouer
- Doigt conseillé pour chaque frappe
- Tempo de 10 % à 150 %
- Sons d’entraînement et VU-mètre réactif
- Cahier imprimable généré depuis une source versionnée

## Essayer le player

Ouvrir `docs/ep133-pad-player.html` dans Chrome ou Edge.

La connexion MIDI et l’analyse de jeu sont le prochain chantier. Le mapping réel du EP-133 sera d’abord mesuré sur la machine, jamais deviné.

## Documentation

- [Feuille de route](docs/ROADMAP.md)
- [Architecture cible](docs/ARCHITECTURE.md)
- [Mise en route Windows](docs/MISE_EN_ROUTE_WINDOWS.md)
- [État du projet](docs/ETAT_DU_PROJET.md)
- [Parcours des 39 exercices](exercises/PARCOURS_EXERCICES_V1.md)
- [Catalogue machine des exercices](exercises/catalogue-exercices-v1.json)
- [Atlas de finger-drumming](handbook/EP133_ATLAS_FINGER_DRUMMING.md)

## Organisation

- `docs/` : documentation et player autonome
- `src/` : source éditable du player
- `exercises/` : exercices en JSON
- `handbook/` : partitions et cahier
- `tools/` : générateurs et vérifications

## Licence

Code du projet : MIT, sauf dépendance future précisant autre chose.

Teenage Engineering, EP-133 et K.O. II sont des marques de leurs propriétaires. Projet communautaire indépendant.
