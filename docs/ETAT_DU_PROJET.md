# État du projet

## Socle validé

- Player autonome, sans dépendance JavaScript externe
- Interface inspirée du EP-133 K.O. II, pads et doigtés visibles
- 39 exercices classés sur 5 niveaux
- Tempo de 10 % à 150 %, sons de repère et VU-mètre
- Partition modèle sur 16 pas avec numéro de pad
- Parcours de 1 à 4 mesures ; les mesures 2 à 4 apportent des variations
- Partition joueur sur la mesure en cours ; les frappes du pad à l'écran s'y écrivent
- Lancement local préparé pour Windows et Raspberry Pi

## Vérification du 9 août 2026

| Contrôle | Résultat |
|---|---|
| Syntaxe JavaScript du player | OK |
| Syntaxe JavaScript de la version autonome | OK |
| Catalogue de 39 exercices | OK |
| Sélecteur 1 à 4 mesures | OK |
| Partition joueur / variations | OK |
| Scripts Windows et Pi | OK (validation de syntaxe) |

## Prochaine brique : le vrai jeu

1. Brancher le EP-133 par USB au PC Windows.
2. Relever les notes, canaux et vélocités réellement envoyés par chaque pad.
3. Connecter ces messages à la partition joueur.
4. Mesurer avance/retard et erreurs de pad.
5. Calculer score, combo et bilan d'exercice.

## Limites actuelles assumées

- La partition joueur enregistre pour l'instant les clics sur le pad visuel ; elle n'est pas encore alimentée par le EP-133.
- Le serveur Raspberry Pi est un serveur d'entraînement sur le réseau local. Il ne peut pas capturer tout seul le MIDI USB branché à un autre PC.
- Le score affiché reste indicatif tant que le mapping physique n'a pas été mesuré.

Le projet a désormais une vraie base de jeu. La prochaine étape n'est plus graphique : c'est le test matériel, là où les notes cessent de faire semblant.
