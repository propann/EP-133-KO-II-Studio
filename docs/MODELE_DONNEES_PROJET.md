# Modèle de données du séquenceur

## Longueur native des patterns

La notice EP-133 OS 2.0 confirme que `LN.1` désigne un pattern d'une mesure et
que chaque groupe accepte une longueur jusqu'à `LN.99`. Dans `ep.project.v1`,
la propriété `bars` de chaque pattern conserve cette valeur explicitement :
elle ne doit pas être recalculée uniquement depuis la dernière note, car un
pattern vide ou volontairement plus long possède malgré tout une longueur.

La valeur est indépendante pour chaque couple groupe/pattern. Le projet réel
de validation le démontre notamment avec `A01 = LN.2`, `C01 = LN.1` et
`C02 = LN.4`. La durée d'une scène suit ensuite le groupe le plus long ; elle
ne doit jamais recopier arbitrairement la même longueur sur A, B, C et D.

Dans l'éditeur, une mesure conserve une largeur fixe de 16 pas × 60 px. Ainsi
`LN.1`, `LN.2` et `LN.4` mesurent respectivement 960, 1920 et 3840 px avant
défilement : le quadrillage ne déforme jamais une longueur pour remplir la
fenêtre.
La réserve blanche de navigation est ajoutée après ces mesures réelles ; elle
ne remplace donc jamais la longueur choisie par `LN`.

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

## Au-dessus de la note : PatternBank, Scène, Song

`SequencerNote`/`ProjectPatterns` restent la seule représentation d'une
frappe. `src/core/project/song.ts` ajoute la couche de composition
au-dessus, sans y toucher :

| Type | Rôle |
|---|---|
| `PatternBank` | `SequencerNote[]` de tous les patterns 01–99, pour tous les groupes ; la présence d'une clé signale un pattern créé, même vide |
| `SceneDefinition` | un pattern par groupe (ou `null` = MUTE) + signature rythmique, pour une scène 1–99 |
| `song: number[]` | la liste ordonnée des Song Positions, chaque entrée étant un numéro de scène |

`patternsForScene(bank, scenes, sceneNumber)` est la seule fonction-pont vers
`ProjectPatterns` — RhythmGrid, PianoRoll, PadStrip et `createMidiFile` ne
savent toujours travailler qu'avec une scène à la fois, à plat, sans connaître
la banque complète. `sceneIsUsed` réplique exactement la règle du décodeur réel
(`importers.ts`) : une scène est exportée dès qu'au moins un groupe n'est pas
MUTE, jamais si tous le sont.

`createEp133ProjectDocument` (exporters.ts) écrit désormais toute la banque et
toutes les scènes utilisées ; `studioStateFromDocument` (studioLibrary.ts) les
relit intégralement au lieu de ne garder que la première Song Position. Voir
`docs/STRUCTURE_SONG_MODE.md` pour la vue d'ensemble et les deux vues Studio
qui exploitent ce modèle.

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
