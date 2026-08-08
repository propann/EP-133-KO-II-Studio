# Feuille de route - EP-133 Rhythm Hero

## Vision

Un coach de finger-drumming qui transforme le EP-133 K.O. II en instrument d'apprentissage : il montre quoi jouer, écoute les frappes réelles, explique les erreurs et fait monter le joueur en difficulté sans le noyer.

## Règle de conception

Une session doit répondre à trois questions :

1. Quel pad dois-je frapper ?
2. Est-ce que je l'ai frappé au bon moment et avec la bonne intensité ?
3. Quel est le prochain petit geste à maîtriser ?

Chaque exercice tient d'abord sur une mesure. Une seule nouveauté rythmique est introduite à la fois.

## Objectifs immédiats

### Objectif 1 - socle jouable

- [x] Pavé inspiré du EP-133 avec groupes A-D et pads numérotés
- [x] Partition 16 pas avec numéro du pad à jouer
- [x] 39 exercices classés niveau 1 à 5
- [x] Doigt conseillé par pad
- [x] Tempo de 10 % à 150 %
- [x] Sons de repère et VU-mètre

**Validation :** choisir un rythme, ralentir, écouter et rejouer la mesure sans matériel connecté.

### Objectif 2 - connexion MIDI réelle

- [ ] Détecter le EP-133 en USB-MIDI sur Windows et Linux
- [ ] Afficher les messages MIDI reçus : note, vélocité, canal, horodatage
- [ ] Relever et confirmer le mapping réel de chaque pad A-D
- [ ] Créer un fichier de mapping versionné
- [ ] Tester note-on, note-off et vélocité

**Validation :** une frappe sur le K.O. II allume exactement le bon pad virtuel.

### Objectif 3 - juge rythmique

- [ ] Départ avec compte à rebours de quatre temps
- [ ] Horloge unique pour audio, animation et analyse
- [ ] Comparaison frappe attendue / frappe reçue
- [ ] Fenêtres : parfait <= 35 ms, bon <= 80 ms, acceptable <= 130 ms
- [ ] Gestion des pads incorrects et des frappes manquées
- [ ] Score, combo, précision et meilleur BPM

**Validation :** terminer un boom-bap niveau 1 avec score détaillé, sans dérive de tempo.

### Objectif 4 - parcours pédagogique

- [ ] Parcours débutant : kick/snare, puis hats, puis contretemps
- [ ] Déblocage du niveau suivant après 90 % de précision
- [ ] Variante lente automatique après trois échecs
- [ ] Conseils ciblés : pad, temps, main ou doigt à retravailler
- [ ] Historique local des scores

**Validation :** un débutant peut passer de 60 BPM à 100 % du tempo sur cinq exercices.

### Objectif 5 - cours, création et studio

- [ ] Onglet Cours : parcours, partitions et démonstrations
- [ ] Onglet Jeu : entraînement MIDI et analyse
- [ ] Onglet Studio : kits, samples, patterns et import MIDI
- [ ] Import de partitions propres depuis MIDI ou stems nettoyés
- [ ] Export de manifestes JSON pour les exercices

**Validation :** créer une nouvelle leçon complète sans modifier le moteur du jeu.

## Décisions techniques

- Application web locale, Chrome ou Edge pour Web MIDI.
- L'horloge du jeu est maîtresse ; les animations ne décident jamais du timing.
- Les exercices sont des manifestes JSON versionnés.
- Le vrai mapping MIDI est mesuré sur la machine avant d'être figé.
- Aucun .ppak importable n'est promis avant test réel sur le firmware de la machine.

## Premier test matériel à faire

1. Connecter le EP-133 au PC par USB.
2. Sélectionner son port MIDI dans l'application.
3. Frapper A-7, A-9, A-5 puis les autres pads.
4. Enregistrer les messages reçus.
5. Valider le mapping avant d'ouvrir le chantier du score.
