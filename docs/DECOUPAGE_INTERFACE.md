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
