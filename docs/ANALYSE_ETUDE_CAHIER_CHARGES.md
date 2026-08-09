# Analyse de l’étude technique proposée

Date de décision : 9 août 2026.

Deuxième passe : ajout des propositions d'ergonomie DAW et des raccourcis le
9 août 2026. Toutes les idées sont suivies individuellement dans
[`REGISTRE_IDEES.md`](REGISTRE_IDEES.md).

## Verdict

L’étude constitue une bonne **vision produit**, mais pas une spécification
binaire directement implémentable. Elle rassemble des fonctions pertinentes
— préparation audio, édition visuelle, sauvegarde sélective et export DAW —
avec plusieurs hypothèses techniques inexactes ou encore non démontrées.

La suite conserve donc les idées utiles, corrige les données vérifiables et
refuse toute écriture matérielle fondée sur une structure supposée.

## Ce que le projet retient maintenant

- Lecture et sauvegarde locale de `.pak` et `.ppak` à partir d’une archive
  réelle servant de base, afin de préserver les champs inconnus.
- Représentation intermédiaire `ep.project.v1`, import/export MIDI et
  compilation contrôlée vers le format machine.
- Sauvegarde sélective des projets, sans recopier inutilement tous les sons.
- Édition visuelle des patterns : position, hauteur, vélocité et durée.
- Inventaire des 999 emplacements sonores, estimation de la mémoire et
  détection des références manquantes.
- Préparation audio avec trim, mono/stéréo, normalisation, pré-écoute et
  conversion exacte vers le format accepté par la machine.
- Lecture seule et sauvegarde avant toute future écriture sur l’EP-133.

Ces points prolongent directement le jeu, le studio et le scanner déjà
présents, sans imposer une réécriture prématurée de l’application.

## Ce que le projet retient pour plus tard

- Forme d’onde, découpage manuel puis détection de transitoires.
- Analyse des doublons par empreinte du signal décodé. Une fusion ne pourra
  jamais être automatique : toutes les références des projets devront être
  vérifiées et remappées.
- Mode d’économie par transposition du sample, uniquement comme option
  expérimentale avec comparaison audible. Il dégrade potentiellement la bande
  passante et ne « double » pas la mémoire sans contrepartie.
- Gestion avancée des scènes, automatisations et paramètres de groupe lorsque
  leurs structures auront été confirmées par captures et tests.
- Export DAWproject, REAPER et Ableton après stabilisation du lecteur `.ppak`.
  L’export MIDI reste prioritaire et universel.
- Application de bureau éventuelle. Tauri et Rust sont des candidats, mais le
  frontend React/Vite et le pont Python actuel restent adaptés au prochain
  jalon. La frontière entre interface et accès matériel doit d’abord être
  stabilisée.

## Ce qui est écarté ou fortement repoussé

- Hébergement de plugins VST3/CLAP : chantier multiplateforme disproportionné
  par rapport au besoin actuel.
- Miroir fidèle de tout l’écran LCD : aucune interface MIDI vérifiée ne fournit
  aujourd’hui l’état complet de l’afficheur.
- Export natif FL Studio annoncé sans format ni implémentation vérifiés.
- Rendu de stems sans disposer des samples et d’un moteur de rendu fidèle.
- Nettoyage ou fusion automatique de sons sur la machine.
- Remplacement immédiat de l’architecture et du thème CSS par Tauri,
  TailwindCSS ou PixiJS sans mesure de performance justifiant la migration.

## Corrections techniques indispensables

| Sujet | Proposition de l’étude | Référence de travail retenue |
|---|---|---|
| Audio natif | 44,1 kHz, 16 bits | WAV mono PCM 16 bits à **46 875 Hz** pour les données natives observées ; les imports ordinaires peuvent être convertis |
| Pads | 16 pads par groupe | **12 pads par groupe**, quatre groupes A–D, soit 48 pads |
| Mémoire | 64 ou 128 Mo sans distinction | Le produit et le guide actuels annoncent 128 Mo ; certaines anciennes unités observées peuvent présenter 64 Mo, donc la capacité doit être lue et non supposée |
| Conteneur | ZIP puis TAR avec sons dans `pads/` | `.pak/.ppak` est un ZIP ; les projets sont des TAR dans `/projects/`, les WAV éventuellement inclus sont au niveau `/sounds/` |
| Fichiers de pads | `pad_a1.bin` à `pad_d16.bin` | Membres `pads/a/p01` à `pads/d/p12`, sans extension ; enregistrements observés de 26 ou 27 octets |
| Patterns | groupe déterminé par le nom | Correct dans le principe : membres `patterns/a01`, `b01`, etc. |
| Événement note | octet 2 note, 3 vélocité, 4–5 durée, 6 drapeaux | Après l’en-tête de quatre octets : position 0–1, pad 2, note 3, vélocité 4, durée 5–6, drapeau 7 |
| Horloge | 96 PPQN pour tout | Patterns internes à 96 PPQN ; l’horloge MIDI externe utilise 24 impulsions par noire |
| Micro-timing | paramètre séparé 0–95 | Le décalage se représente d’abord par la position exacte en ticks ; aucun champ autonome général n’est confirmé |
| Enveloppe | ADSR par pad | Les structures vérifiées exposent surtout Attack et Release, pas une ADSR complète |
| Fader MIDI | CC libre vers douze paramètres | Les CC observés/documentés sont limités ; les douze cibles internes du fader ne constituent pas douze CC MIDI externes |
| Supertone | sortie interne EP-133 | Supertone concerne l’EP-40 ; ne pas l’attribuer au K.O. II |

Le dernier octet des notes, les automatisations, les effets Punch-In et certains
champs de scène restent partiellement compris. Ils doivent être conservés à
l’identique lors d’une modification tant que leur sémantique n’est pas prouvée.

## Sources et règles de licence

- Le guide officiel EP-133 reste la source fonctionnelle prioritaire pour les
  capacités visibles de la machine.
- `kmorrill/ep-series-sysex` (MIT) est la base technique principale : ses
  structures sont reliées à des captures et le scanner du projet l’utilise
  déjà en lecture seule.
- `DannyDesert/EP133-skill` (MIT) est une référence utile pour la génération de
  projets, mais chaque structure produite doit être recoupée et testée.
- `phones24/ep133-export-to-daw` démontre la faisabilité des exports Ableton,
  DAWproject, REAPER et MIDI. Sa licence AGPL-3.0 interdit d’en recopier
  simplement le code dans ce dépôt sans assumer les obligations associées.
- `seajaysec/ep-unity` est une source de recherche seulement : son auteur
  avertit explicitement d’un risque de rendre l’appareil inutilisable.
- `benjaminr/mcp-koii` peut inspirer le contrôle MIDI, pas le décodage des
  projets.

## Priorités révisées

### Indispensable

1. Solidifier transport, tests et séparation des pages.
2. Charger, sauvegarder et comparer un projet `.pak/.ppak` sans perte.
3. Compiler sur une copie d’archive réelle et produire un rapport de validation.
4. Importer/exporter le MIDI et éditer position, note, vélocité et durée.
5. Afficher l’occupation mémoire estimée avant toute préparation de sons.
6. Garder le scan et les sauvegardes en lecture seule par défaut.

### Majeur ensuite

1. Pipeline audio 46 875 Hz/16 bits avec trim, mono/stéréo et normalisation.
2. Forme d’onde et slicing manuel, puis détection de transitoires.
3. Scènes, automations et paramètres dont les formats ont été validés.
4. Sauvegarde « projets seulement » mesurée sur plusieurs machines.
5. Premier export DAW ouvert, en commençant par DAWproject ou REAPER.

### Expérimental

Live Control étendu, déduplication assistée, mode Space-Saver et paquet desktop.
Les plugins audio, le miroir LCD complet et les exports DAW propriétaires
complexes ne font pas partie de la version 1.

## Critère de confiance

Une fonction liée au format machine passe successivement par : lecture d’une
archive réelle, conservation des octets inconnus, test aller-retour sans
modification, comparaison binaire, génération sur une copie, puis essai dans
un projet brouillon sauvegardé. Aucun gain de vitesse ou de capacité ne sera
annoncé avant mesure.

## Complément — ergonomie DAW proposée

La deuxième version de l'étude améliore nettement la description de l'éditeur.
Les gestes de base sont retenus : création au clic, suppression rapide,
redimensionnement du gate, déplacement libre avec Alt, sélection rectangulaire,
pan, zoom, quantification et duplication.

Quelques propositions doivent néanmoins être arbitrées avant le code :

- le double-clic est décrit à la fois comme création et suppression ; il est
  donc écarté de la version 1 ;
- Alt + molette ne peut pas commander simultanément la vélocité d'une note et
  le zoom vertical sans règle contextuelle difficile à découvrir ;
- les raccourcis doivent agir seulement lorsque l'éditeur possède le focus,
  afin de ne pas casser les commandes du navigateur ;
- le clic droit doit garder une alternative clavier et ne supprimer le menu
  contextuel que dans la grille ;
- un historique Annuler/Rétablir doit précéder les gestes destructifs rapides ;
- le mute d'une note n'a pas de représentation native confirmée et doit rester
  un état local tant que son export n'est pas défini.

Corrections supplémentaires : Attack et Release utilisent une plage observée
0–255 ; la résonance de filtre par pad n'est pas démontrée ; Note Repeat peut
être produit comme une suite de notes mais aucun champ natif de ratchet n'est
confirmé ; l'EP-133 gère jusqu'à 99 mesures de pattern, ce qui ne signifie pas
une grille matériellement limitée à 99 pas.
