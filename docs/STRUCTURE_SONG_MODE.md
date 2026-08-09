# Structure du morceau — Song mode EP-133

## Source fonctionnelle

La section 6.2 du manuel OS 2.0 décrit quatre niveaux distincts :

1. un **projet** est le morceau ;
2. chaque groupe A–D possède ses **patterns**, numérotés de 01 à 99 ;
3. une **scène** choisit un pattern pour chaque groupe ;
4. une **Song Position** place une scène dans l'ordre du morceau.

Une Song Position dure autant que le pattern le plus long de sa scène. Une
liste peut contenir jusqu'à 99 positions. Cette règle, et non la reproduction
de l'illustration du manuel, guide notre interface.

## Première intégration dans le Studio

Le bandeau Song mode affiche maintenant les repères utilisés par la machine :

- `SONG POS 01` et `[L.01]` pour la position dans la liste ;
- `SCENE 01` et `[S.01]` pour la scène assignée ;
- `PATTERN A01`, `B01`, `C01`, `D01` pour les quatre groupes ;
- la longueur de chaque pattern et celle de la Song Position ;
- le groupe actuellement édité en ambre.

Cliquer un pattern A01–D01 sélectionne le groupe correspondant dans la grille.
La longueur de la scène est calculée à partir du groupe qui contient le plus de
mesures, conformément au fonctionnement décrit dans le manuel.

## Étape suivante

Le modèle actuel conserve une scène et une position. La prochaine évolution ne
doit pas seulement dessiner des cartes supplémentaires : elle doit stocker de
vrais patterns A01–D99, des scènes S.01–S.99 et une liste L.01–L.99, puis faire
suivre le transport et les exports. La zone « prochaine Song Position » est
donc volontairement informative et non cliquable pour le moment.

Le PDF officiel et ses illustrations ne sont pas redistribués dans le dépôt.
Seuls les concepts fonctionnels et les repères de la machine sont repris.
