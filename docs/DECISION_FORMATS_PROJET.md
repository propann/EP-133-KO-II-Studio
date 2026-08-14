# Décision — formats de projet

Date : 9 août 2026
Statut : adoptée

## Décision

Le projet ne créera pas de format de composition propriétaire Rhythm Hero.
Les fichiers proposés à l'utilisateur seront ceux de l'écosystème EP-133 et le
MIDI standard.

## Formats retenus

### `.ppak` et `.pak`

Formats de sauvegarde et de transfert de la machine. Un fichier existant doit
être chargé comme base avant modification afin de préserver les champs inconnus.

### `.mid`

Format d'échange des notes, tempos et durées avec les DAW. Il ne contient ni les
samples ni tous les réglages propres à l'EP-133.

### `ep.project.v1.json`

Description technique lisible acceptée par le compilateur open source
`ep-series-sysex`. C'est une représentation intermédiaire pour éditer, tester et
compiler un projet ; ce n'est pas un nouveau format musical concurrent.

## Menu SAVE prévu

- Ouvrir une sauvegarde `.pak/.ppak` ;
- importer un `.mid` ;
- sauvegarder une copie `.ppak` ;
- exporter MIDI ;
- exporter le JSON technique pour diagnostic avancé ;
- envoyer vers un projet brouillon après checkpoint et confirmation.

## Conséquences

- Les exercices du jeu seront convertibles vers MIDI et projet EP-133.
- Les informations pédagogiques restent dans le catalogue interne et ne
  contaminent pas le fichier machine.
- L'export `.ppak` autonome est maintenant généré et contrôlé localement par
  round-trip. Il n'est pas annoncé compatible firmware avant essai sur un
  emplacement de projet sauvegardé ; l'écriture conserve donc une archive de
  base réelle pour préserver les membres inconnus.

## État du lecteur

Le module `src/core/project/importers.ts` prend maintenant en charge :

- MIDI formats 0 et 1 avec tempo, notes, vélocités et durées ;
- validation du document intermédiaire `ep.project.v1` ;
- inspection non destructive du ZIP `.pak/.ppak`, de `meta.json`, de la liste
  des projets TAR et des sons WAV.

Le TAR interne et ses structures prouvées sont également décodés en lecture
seule : pads, notes, automations, scènes, song et tempo. Les membres et champs
bruts sont conservés. Le branchement au menu SAVE reste séparé afin de tester
d'abord le transport et le cycle de vie des fichiers.
