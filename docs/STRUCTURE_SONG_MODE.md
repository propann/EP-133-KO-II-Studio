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

## Modèle réel dans le Studio

Le Studio stocke désormais toute la hiérarchie, pas une seule scène figée :

- `PatternBank` (`src/core/project/song.ts`) garde tous les patterns 01–99 de
  tous les groupes ; un trou (ex. pas de B01) est légal et préservé, jamais
  comblé — conforme aux scans réels de la machine.
- `SceneDefinition[]` garde toutes les scènes S.01–S.99, chacune choisissant un
  pattern par groupe ou `null` (MUTE, `0` côté machine).
- `song: number[]` garde la liste complète L.01–L.99, l'ordre chronologique du
  morceau. Une scène est une ressource partagée : deux Song Positions peuvent
  référencer la même scène, et la modifier depuis l'une change l'autre —
  fidèle au fonctionnement réel de la machine.

Deux vues exploitent ce modèle, basculables via `[ EDIT PATTERN ] / [ ARRANGEMENT ]` dans la barre du Studio :

- **Pattern Editor** : la grille existante, plus un sélecteur `PATTERN: [ A01 ▲▼ ]`
  pour choisir quel numéro de pattern du groupe actif est édité.
- **Song Arranger** (`SongArranger.tsx`) : un storyboard horizontal, une carte
  par Song Position, montrant les 4 blocs de groupe de sa scène avec un
  aperçu schématique (dérivé des frappes, pas de l'audio). `[DUP]` crée une
  scène indépendante pour varier sans affecter les positions qui partagent la
  scène source ; `[DELETE]` retire la position sans supprimer la scène si
  elle reste utilisée ailleurs. Le glisser-déposer réordonne les positions et
  affecte un pattern du pool à un bloc de groupe.

Convention visuelle propre au Studio (pas un fait matériel confirmé) : dans
l'Arrangeur seulement, les groupes A/B/C/D sont respectivement orange, jaune,
anthracite et gris (`--group-a/b/c/d` dans `style.css`). Ailleurs dans
l'interface (onglets de groupe, PadStrip), la couleur reste uniquement liée à
la sélection, comme avant.

## Limite assumée

La lecture reste bornée à une scène à la fois — auditionner une Song Position
depuis l'Arrangeur (`▶`) joue sa scène en boucle simple. L'avancée automatique
d'une Song Position à la suivante pendant la lecture du morceau complet **n'est
pas implémentée** : ce serait un remaniement du transport plus large que ce
chantier. Le modèle de données (patterns/scènes/song) est en revanche complet
et s'exporte/s'importe fidèlement.

Le PDF officiel et ses illustrations ne sont pas redistribués dans le dépôt.
Seuls les concepts fonctionnels et les repères de la machine sont repris.
