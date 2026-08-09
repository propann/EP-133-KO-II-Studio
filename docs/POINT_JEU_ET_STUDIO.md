# Point d'étape — Jeu et Studio

Date : 9 août 2026.

L'application comporte deux grandes sections qui partagent l'audio, le MIDI et
les informations de pads, mais répondent à des besoins différents. Il faut
préserver cette séparation : le jeu doit rester immédiat et pédagogique ; le
Studio peut devenir plus dense et précis.

## 1. Rhythm Hero — apprendre et jouer

### Ce qui est solide

- Connexion MIDI sans calibration obligatoire, mapping des notes 36–83.
- Jeu libre audible même hors exercice.
- Compte à rebours d'une mesure, lecture seule et vraie session de score.
- Sons distincts sur les 12 pads, réglages modèle/joueur et faible latence.
- Partition modèle et frappes joueur superposées avec couleurs différentes.
- Fenêtre animée sur deux mesures et suivi du curseur.
- Seuils PERFECT/GOOD/MISS, combo et meilleur combo testés.
- 39 styles conservés et cinq niveaux disponibles sans accélérer le tempo.
- Boom-Bap possède cinq niveaux réellement écrits ; le reste est encore généré.

### Ce qui reste fragile

1. **Omissions non comptées à la fin.** Une note attendue jamais frappée n'est
   pas encore transformée en MISS. La précision peut donc être trop généreuse.
2. **Contenu pédagogique inégal.** Seul Boom-Bap dispose de cinq niveaux
   composés à la main ; les autres styles restent provisoires.
3. **Génération dans `App.tsx`.** La fabrication des exercices et le catalogue
   utilisateur doivent rejoindre un module pédagogique testable.
4. **Fenêtre fixe.** `ScoreView` rend toujours 32 pas/deux mesures. C'est adapté
   au jeu actuel, mais les signatures différentes de 4/4 nécessiteront un
   modèle d'affichage plus souple.
5. **Bilan de fin minimal.** Il manque une vraie synthèse par pad, avance/retard,
   omissions et progression pédagogique.

### Priorité du jeu

Corriger d'abord le bilan des notes manquées, puis produire les styles par blocs
de cinq niveaux. Ne pas alourdir l'écran avec des fonctions de DAW.

## 2. Studio EP-133 — créer et transférer

### Ce qui est solide

- Quatre groupes A–D et ordre physique unique des 12 pads.
- Grille horizontale extensible avec mesure de réserve automatique.
- Modes ONE et KEYS, piano-roll et hauteurs MIDI.
- Modèle canonique avec groupe, position, pad, hauteur, vélocité et durée.
- Lecture PC dans l'éditeur du jeu et lecture directe par l'EP-133 dans le
  Studio complet.
- Boucle, curseur, défilement automatique et sortie d'horloge MIDI.
- Export MIDI multi-groupes et document technique `ep.project.v1`.
- Lecteur `.pak/.ppak` et TAR validé sur le projet 1 réel.
- Composants visuels séparés du transport et des formats.

### Ce qui reste fragile

1. **SAVE trompeur en mode complet.** La sauvegarde locale actuelle crée un
   exercice utilisateur à partir du groupe visible. Elle ne conserve pas encore
   proprement les quatre groupes, modes de pads, scènes et informations machine.
   Le bouton doit devenir le menu de fichiers prévu dans la feuille de route.
2. **Import non branché à l'interface.** Les lecteurs MIDI et `.pak/.ppak`
   existent et sont testés, mais aucun bouton LOAD ne remplit encore le Studio.
3. **Vélocité et durée invisibles.** Le modèle et les exports les conservent,
   mais l'utilisateur ne peut pas encore les modifier graphiquement.
4. **Une seule couche de patterns.** Le Studio n'affiche pas encore les pools de
   patterns A01–D99, les 99 scènes et la liste song.
5. **Pas d'Annuler/Rétablir.** Ce prérequis doit arriver avant les futurs gestes
   rapides de suppression, déplacement et redimensionnement.
6. **État encore concentré dans `App.tsx`.** Les composants sont séparés, mais
   les états jeu et studio cohabitent encore. Un hook Studio sera pertinent
   après la conception du vrai Save/Load.

### Priorité du Studio

Construire le menu Nouveau/Ouvrir/Sauvegarder et assurer la conservation des
quatre groupes avant d'ajouter l'édition avancée. Un joli piano-roll qui perd
des groupes à la sauvegarde ne serait pas acceptable.

## Concepts du manuel à reprendre pour les partitions

Le manuel officiel ne doit pas être copié. Les concepts de mise en page
généraux suivants peuvent toutefois guider des composants originaux :

### Hiérarchie à trois niveaux

1. **Bandeau noir** : contexte courant, par exemple `PATTERN A01` ou
   `SCÈNE 03`.
2. **Bandeau gris** : mesure, signature, grille et fonction sélectionnée.
3. **Orange** : uniquement le curseur, la sélection ou l'action immédiate.

### Affichage par opération

Quand une note est sélectionnée, afficher un petit panneau technique original :

```text
NOTE  C3     VELOCITY  104
GATE  24T    POSITION  01:03:12
```

Ce panneau remplace les longs textes permanents. Il reprend l'idée du manuel
« une opération, une information », sans reproduire ses dessins.

### Partition Studio proposée

- Colonne des pistes fixée à gauche, déjà en place.
- Ligne supérieure `SCÈNE / PATTERN / MESURE` en bandeaux industriels.
- Numéros de pas très lisibles, alternance gris/orange légère par mesure.
- Notes percussives sous forme de blocs courts.
- Notes KEYS sous forme de rectangles dont la largeur représente le gate.
- Vélocité sous la grille dans une bande repliable.
- Micro-timing visible comme un décalage du bloc par rapport au trait du pas.
- Marqueur orange vertical unique pour la lecture.
- Aides `PRESS`, `HOLD`, `SLIDE` seulement au survol ou dans une barre d'aide,
  jamais répétées dans chaque cellule.

### Partition Jeu proposée

Conserver le principe actuel, plus simple : deux mesures, 12 pistes, modèle et
joueur superposés. Améliorer seulement les bandeaux, les numéros de mesure et le
bilan final. Les contrôles détaillés de vélocité et de gate appartiennent au
Studio.

## Ordre recommandé

1. Corriger les omissions dans le score et créer le bilan de fin.
2. Remplacer SAVE du Studio par un vrai cycle Nouveau/Ouvrir/Sauvegarder.
3. Ajouter Annuler/Rétablir.
4. Ajouter la sélection d'une note et son panneau technique.
5. Afficher et éditer vélocité puis gate.
6. Ajouter patterns et scènes après validation du Save/Load.
7. Continuer les cinq exercices par style en parallèle, par petits blocs.

## Décision

Le jeu est la section la plus mature pour l'utilisateur. Le Studio possède les
fondations de format les plus avancées, mais pas encore la gestion de fichiers
qui permettra de lui faire confiance. La prochaine évolution fonctionnelle doit
donc traiter un défaut critique court du jeu, puis sécuriser SAVE/LOAD avant de
redessiner profondément la partition Studio.
