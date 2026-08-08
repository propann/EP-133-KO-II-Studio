# Architecture cible

## Les trois couches

### 1. Le K.O. II

Il envoie les frappes MIDI : note, vélocité, canal et horodatage. Il reste l’instrument, pas une simple décoration USB.

### 2. Le moteur de jeu

Il possède l’horloge maîtresse, lit la partition, attend les frappes, calcule les écarts de timing et attribue score, combo et précision.

### 3. L’interface

Elle montre le pad à jouer, la partition, le doigt conseillé, le tempo, les retours de jeu et la progression.

## Modules prévus

- `core/midi` : connexion Web MIDI, détection du K.O. II et mapping réel
- `core/engine` : horloge, fenêtres de timing, score et états d’exercice
- `core/audio` : métronome, sons de repère et backing tracks
- `exercises` : manifestes JSON versionnés
- `components` : player, partition, analyse et parcours

## Principe non négociable

Une seule horloge est utilisée pour l’audio, le défilement visuel et le jugement des frappes. Sinon le jeu ment, et un coach qui ment finit dans un placard avec les câbles USB morts.
