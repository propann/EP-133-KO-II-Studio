# État du projet

> Mise à jour consolidée : 9 août 2026. La source principale est désormais
> l'application React/TypeScript. Le player HTML reste une référence historique.

## Socle validé

- Player autonome, sans dépendance JavaScript externe
- Interface inspirée du EP-133 K.O. II, pads et doigtés visibles
- 39 exercices classés sur 5 niveaux
- Tempo de 10 % à 150 %, sons de repère et VU-mètre
- Partition modèle multi-mesures, avec une grille de 16 pas par mesure et le
  numéro du pad dans chaque frappe attendue
- Parcours de 1 à 4 mesures ; les mesures 2 à 4 apportent des variations
- Partition joueur complète sur 1 à 4 mesures ; les frappes restent visibles
  dans leur mesure jusqu'à la fin de la session
- Lancement local préparé pour Windows et Raspberry Pi

## Vérification du 9 août 2026

| Contrôle | Résultat |
|---|---|
| Syntaxe JavaScript du player | OK |
| Syntaxe JavaScript de la version autonome | OK |
| Catalogue de 39 exercices | OK |
| Sélecteur 1 à 4 mesures | OK |
| Partition joueur / variations | OK |
| Affichage simultané des mesures 1 à 4 | OK |
| Conservation des frappes après changement de mesure | OK |
| Scripts Windows et Pi | OK (validation de syntaxe) |

## Partition multi-mesures

- Une mesure sélectionnée occupe toute la largeur utile.
- Deux à quatre mesures sont affichées deux par ligne sur écran large et une
  par ligne sur petit écran.
- Chaque mesure modèle utilise sa variation réelle.
- Le curseur orange se déplace uniquement dans la mesure active.
- La partition joueur utilise le même découpage et conserve toutes les frappes.
- Une nouvelle session vide les anciennes frappes ; la fin affiche `TERMINÉ`
  sans effacer la session qui vient d'être jouée.

## Parcours React par styles

- Les 39 styles historiques restent présents dans le sélecteur.
- Chaque style doit recevoir cinq partitions de difficulté croissante.
- Premier groupe finalisé : Boom-Bap niveaux 1 à 5, six mesures par niveau.
- Les niveaux Boom-Bap ont des patterns dédiés, des variations sur la cinquième
  mesure et un fill final adapté au niveau sur la sixième.
- Les autres styles restent jouables avec leur génération provisoire et seront
  remplacés progressivement par blocs de cinq partitions validées.

## Prochaine brique : validation complète du vrai jeu

1. Brancher le EP-133 par USB au PC Windows.
2. Relever les notes, canaux et vélocités réellement envoyés par chaque pad.
3. Connecter ces messages à la partition joueur.
4. Mesurer avance/retard et erreurs de pad.
5. Calculer score, combo et bilan d'exercice.

## Limites actuelles assumées

- Le player React reçoit le Web MIDI avec le mapping officiel validé. Le player
  autonome historique enregistre encore uniquement les clics virtuels.
- Le serveur Raspberry Pi est un serveur d'entraînement sur le réseau local. Il ne peut pas capturer tout seul le MIDI USB branché à un autre PC.
- Le score doit encore recevoir une campagne complète de tests de latence et de
  précision, même si le mapping physique est validé.

## Suite modulaire et studio

- Page d'accueil avec trois modules : jeu, studio et sons/transfert.
- Éditeur du jeu et studio complet séparés, chacun revenant à l'accueil.
- Studio sur groupes A–D avec 12 pistes, mesures horizontales extensibles,
  piano-roll KEYS, lecture, boucle, horloge et sortie MIDI vers l'EP-133.
- Le Studio possède maintenant un vrai cycle local `NOUVEAU / SAVE / OUVRIR`
  basé sur `ep.project.v1`. Il conserve les quatre groupes, le BPM, la hauteur,
  la vélocité, la durée et les modes de pad sans fermer l'éditeur.
- La sauvegarde des exercices USER reste séparée de celle des projets Studio.
- Les commandes Studio sont regroupées dans le menu `FICHIER` : Nouveau,
  Ouvrir, Enregistrer, Enregistrer sous, Renommer, Dupliquer, Supprimer et
  Exporter. La suppression demande une confirmation explicite.
- Le Studio affiche la première structure Song mode avec les repères natifs
  `L.01`, `S.01` et `A01–D01`. La durée de la position reprend celle du pattern
  le plus long. Les positions et scènes multiples restent à implémenter.
- Le projet 1 réel de la machine peut être ouvert depuis `FICHIER`. Le bouton
  charge l'instantané de `L.01/S.01` en lecture seule, sans écrire sur l'EP-133.
- La page Sons & Transfert initialise maintenant un profil de machine nommé,
  son modèle mémoire 64/128 Mo, son dossier privé de samples et un miroir global
  des 527 slots occupés (56,21 Mo). Les fichiers audio ne sont pas encore copiés.
- Export MIDI ou description `ep.project.v1` JSON.
- Scan SysEx en lecture seule validé sur la machine : 527 sons, 56,21 Mo,
  affectations de pads, noms, modes et notes racines.
- Inventaire du projet 1 affiché dans la page Sons & Transfert.
- Transfert sonore volontairement verrouillé jusqu'à la mise en place du calcul
  mémoire, de la sauvegarde, de la confirmation et de la relecture.

## Décision de consolidation

Le développement fonctionnel est temporairement ralenti pour découper le gros
composant d'interface, ajouter les tests, documenter les formats et construire
une vraie gestion Save/Load. La feuille de route détaillée se trouve dans
[`ROADMAP.md`](ROADMAP.md).

## Solidification en cours

- Étape 1.1 terminée : la génération MIDI et `ep.project.v1` est sortie de
  `App.tsx` vers `src/core/project/exporters.ts`.
- Une vérification automatisée couvre l'en-tête MIDI, le mapping d'un pad, une
  hauteur KEYS, les quatre patterns et le mode de pad exporté.
- Commande : `npm run test:exports`.
- Décision prise : ne pas créer de format natif Rhythm Hero. Le menu Save/Load
  utilisera `.pak/.ppak`, MIDI et le JSON technique `ep.project.v1`.
- Prochaine étape : charger ces formats avant de construire le menu complet.
- Transport solidifié : timers jeu/studio séparés, STOP centralisé, anciennes
  sessions asynchrones invalidées et nettoyage complet au retour accueil.
- Le PANIC MIDI couvre désormais les 16 canaux avec All Notes Off et All Sound
  Off ; une disparition du port pendant l'arrêt est tolérée.
- Vérification dédiée : `npm run test:transport`.
- Premier découpage React terminé : `HomePage` et `SoundsPage` sont sorties de
  `App.tsx`, et le contrat de l'inventaire machine est centralisé dans
  `src/core/project/device.ts`.
- Le jeu puis le studio seront extraits par composants visuels avant tout
  déplacement supplémentaire de la logique de transport.
- Le jeu est maintenant séparé en `GameToolbar`, `ScoreView`,
  `PerformancePanel` et `PadSoundEditor`. Ces composants sont visuels et ne
  deviennent pas propriétaires de l'horloge.
- L'ordre physique des 12 pads est centralisé dans `core/project/pads.ts`.
- Le studio est séparé en `EditorToolbar`, `PadStrip`, `RhythmGrid` et
  `PianoRoll`. Les patterns et actions restent fournis par `App.tsx` afin de ne
  pas dupliquer l'état.
- Le découpage visuel prévu par l'étape 1.4 est terminé. La prochaine étape est
  l'unification du modèle de données avant l'extraction d'un hook d'éditeur.
- Le modèle `SequencerNote` est maintenant utilisé par le studio, l'import MIDI
  et les deux exports. Groupe, hauteur, vélocité et durée ne sont plus ajoutés
  artificiellement au dernier moment.
- Les exercices existants restent compatibles grâce à un adaptateur avec
  vélocité 100 et durée d'un seizième par défaut.
- Le score et l'extension automatique disposent maintenant d'une vérification
  dédiée avec `npm run test:engine`.
- Les calculs de mesure ont été sortis des clics React vers
  `src/core/project/editor.ts`, ce qui évite les divergences entre grille pads
  et piano-roll.
- L'accueil possède un quatrième module Documentation. Il indexe six guides du
  projet, explique les conventions PRESS/HOLD/SLIDE avec des dessins HTML/CSS
  originaux et renvoie vers le guide officiel.
- Le manuel OS 2.0 local a servi à analyser la charte, mais n'est pas copié dans
  le dépôt : sa section de propriété intellectuelle interdit la redistribution
  de ses images et contenus protégés.
- Le noyau sait désormais relire les MIDI formats 0/1 qu'il exporte, conserver
  tempo, position, vélocité et durée, puis les répartir sur les groupes A–D.
- Un inspecteur ouvre les conteneurs ZIP `.pak/.ppak`, valide `meta.json` et
  inventorie les projets TAR et les WAV sans modifier l'archive.
- La prochaine sous-étape est le décodage en lecture seule des pads, patterns et
  scènes contenus dans un TAR de projet réel. **Étape terminée.**
- Le lecteur TAR expose maintenant les pads 26/27 octets, les notes et
  automations des patterns, les scènes, la liste song et le tempo, tout en
  conservant les octets bruts.
- Validation sur le projet 1 réel : 48 pads, 11 patterns, 125 notes, 3 scènes,
  tempo 120 BPM et aucun avertissement. Aucun accès en écriture n'a été fait.

## Étude technique externe analysée

Le cahier des charges « compagnon ultime » a été conservé comme source d'idées,
mais corrigé avant intégration à la feuille de route. Les faits désormais
retenus sont notamment : 12 pads par groupe, patterns internes à 96 PPQN,
horloge MIDI à 24 PPQN et WAV natifs observés à 46 875 Hz en PCM 16 bits.

Les fonctions sûres et proches du produit — Save/Load `.pak/.ppak`, édition des
événements, jauge mémoire et préparation audio — restent prioritaires. Les
exports DAW, la déduplication, le Space-Saver et une éventuelle application
Tauri sont reportés. Les plugins VST3/CLAP et le miroir LCD complet sortent du
périmètre de la version 1.

Voir [`ANALYSE_ETUDE_CAHIER_CHARGES.md`](ANALYSE_ETUDE_CAHIER_CHARGES.md) pour
les corrections binaires, les licences et les critères de validation.

La deuxième version de l'étude, enrichie des conventions de piano-roll et des
raccourcis DAW, est également triée. Le fichier
[`REGISTRE_IDEES.md`](REGISTRE_IDEES.md) conserve chaque proposition avec un
identifiant, un statut et une condition. Les interactions cohérentes sont
ajoutées à la phase d'édition avancée ; les conflits de gestes, fonctions non
prouvées et chantiers hors version 1 restent visibles sans entrer dans le code.
