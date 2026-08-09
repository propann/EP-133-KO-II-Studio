# Découpage de l'interface React

## Objectif

Réduire progressivement `App.tsx` sans réécrire l'interface ni déplacer la
logique audio/MIDI au hasard. Chaque extraction doit conserver les mêmes
classes CSS et passer le build avant la suivante.

## Sous-étape 1.4a — accueil et sons

Statut : terminé le 9 août 2026.

- `src/pages/HomePage.tsx` contient la page d'entrée et ses trois modules.
- `src/pages/SoundsPage.tsx` contient l'inventaire et la zone de transfert
  volontairement désactivée.
- `src/core/project/device.ts` porte le contrat TypeScript de l'inventaire lu
  sur la machine.
- `App.tsx` conserve l'état, la navigation et les actions MIDI, puis transmet
  uniquement les données et callbacks nécessaires.

L'activation clavier des cartes Accueil intercepte correctement Entrée et
Espace sans faire défiler la page.

## Découpage suivant

1. extraire la barre et la partition du jeu sous forme de composants purs ;
2. extraire le panneau des pads et le mini-mixeur ;
3. isoler `EditorOverlay`, puis séparer grille pads et piano-roll ;
4. déplacer ensuite les états complexes vers des hooks ciblés uniquement si
   les frontières obtenues sont stables.

Le transport et les accès MIDI restent dans `App.tsx` pendant ces extractions
afin d'éviter deux propriétaires concurrents de l'horloge.

## Sous-étape 1.4b — composants visuels du jeu

Statut : terminé le 9 août 2026.

- `GameToolbar` possède uniquement les interactions visuelles de la barre ; les
  actions de transport restent des callbacks fournis par `App.tsx`.
- `ScoreView` affiche les deux mesures, les frappes et le curseur sans connaître
  Tone.js ni Web MIDI.
- `PerformancePanel` affiche les pads et VU-mètres puis remonte les clics.
- `PadSoundEditor` édite un réglage reçu sans posséder la banque sonore.
- `core/project/pads.ts` devient la source unique pour l'ordre physique, les
  touches et les noms des 12 pads.

La prochaine extraction porte sur `EditorOverlay`, sa grille de pads et son
piano-roll. Elle sera faite avant de déplacer l'état de l'éditeur dans un hook.

## Sous-étape 1.4c — composants visuels du studio

Statut : terminé le 9 août 2026.

- `EditorToolbar` affiche le nom, les groupes, le transport, la boucle et les
  exports à partir de propriétés et callbacks.
- `PadStrip` rend les 12 pads, leur nom réel et leur mode ONE/KEYS.
- `RhythmGrid` affiche les pistes continues et transmet les modifications de
  pas sans posséder les patterns.
- `PianoRoll` affiche les hauteurs et transmet les modifications de notes.
- La grille et le piano-roll partagent toujours la même référence de viewport,
  nécessaire au suivi automatique de la lecture.

L'état complexe n'est pas déplacé artificiellement : le prochain chantier doit
d'abord unifier le modèle de notes et de projets, puis un hook d'éditeur pourra
être extrait avec une API cohérente.
