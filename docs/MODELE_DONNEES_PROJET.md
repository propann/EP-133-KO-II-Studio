# Modèle de données du séquenceur

## Pourquoi ce modèle existe

Le jeu pédagogique et le studio utilisaient auparavant la même forme minimale
de cible : un identifiant, un temps et un pad. Les exports ajoutaient ensuite
une vélocité et une durée fixes. Cette organisation empêchait de relire puis
réexporter fidèlement un MIDI et préparait mal les futurs éditeurs de vélocité,
gate et micro-timing.

## Note canonique

`src/core/project/model.ts` définit désormais `SequencerNote` :

| Champ | Rôle |
|---|---|
| `id` | identité stable de l'événement |
| `group` | groupe EP-133 A, B, C ou D |
| `beat` | position en noires, convertible exactement vers 96 PPQN |
| `pad` | index visuel 0–11 |
| `note` | hauteur MIDI optionnelle pour KEYS |
| `velocity` | vélocité MIDI 1–127 |
| `duration` | durée en noires, minimum un tick à 96 PPQN |

`ProjectPatterns` contient toujours les quatre groupes, même lorsqu'ils sont
vides. `emptyProjectPatterns()` est la seule fabrique de cette structure.

## Frontières

- Le studio travaille avec `SequencerNote` de bout en bout.
- L'import MIDI crée directement ces notes et conserve vélocités et durées.
- L'export MIDI utilise leur vélocité et leur durée réelles.
- Le document `ep.project.v1` convertit la position et la durée vers 96 PPQN.
- Le jeu continue d'utiliser ses `Target`, adaptés à l'entrée et à la sortie,
  car son moteur de score possède des états HIT/MISS qui ne doivent pas
  contaminer un projet musical.

## Compatibilité

Les anciens exercices sont convertis avec une vélocité de 100 et une durée de
0,25 noire, soit un seizième. La normalisation limite la vélocité à 1–127 et la
durée à au moins 1/96 de noire.

## Vérification

`npm run test:exports` contrôle :

- la conservation d'une vélocité non standard après export/import MIDI ;
- la conservation d'une durée d'une croche ;
- la conversion de cette durée en 48 ticks dans le document EP-133 ;
- les valeurs par défaut des anciens exercices ;
- les bornes de normalisation.
