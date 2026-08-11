# EP-133 KO II Studio

[Français](README.md) · [English](README.en.md) · [Español](README.es.md)

**Le studio compagnon open source pour créer avec l'EP-133 K.O. II.**

EP-133 KO II Studio transforme la machine en environnement de production
complet : clone ses projets et ses sons, ouvre les patterns réels, construit
des scènes et des Songs, travaille hors ligne puis prépare un retour vérifié
vers le matériel. Le tout reste local, inspectable et utilisable sans compte.

> **Machine → Studio → création → machine.** Le projet vise un workflow que
> l'EP Sample Tool officiel ne couvre pas : comprendre et retravailler la
> musique contenue dans l'EP-133, pas seulement déplacer des fichiers audio.

> Projet communautaire indépendant. La lecture, le jeu MIDI et la sélection
> active A–D sont disponibles ; toute écriture persistante de projet ou de
> sample reste verrouillée jusqu'à la validation des protections de sauvegarde,
> confirmation et relecture.

## Reprise par une autre IA

Plusieurs agents travaillent sur ce dépôt. Lire d'abord [la passation
complète](docs/AI_HANDOFF.md) : état réel, contraintes, matériel et prochaine
mission, avant toute modification.

## Ce que le Studio permet

- **Cloner la machine** : 9 projets, samples PCM, métadonnées, hashes et
  historique incrémental dans un miroir privé local.
- **Ouvrir de vrais morceaux** : lecture des archives `.pak/.ppak`, patterns
  A–D, scènes, Song Positions, tempo, pads et réglages conservés.
- **Éditer et arranger** : grille multi-mesures, piano-roll KEYS, banques de
  patterns 01–99, scènes partagées et Song Arranger.
- **Travailler avec les vrais sons** : EP-133 connecté en MIDI, samples du
  clone hors ligne, ou moteur audio interne de secours.
- **Préparer le retour matériel** : diff, checkpoint, confirmation et relecture
  sont conçus avant toute écriture persistante.
- **Diagnostiquer le matériel** : façade interactive, journal MIDI/SysEx brut
  et cartographie des contrôles de la machine.

## Fonctionnalités

### Pattern & Song Studio

- quatre groupes A–D et 12 pads par groupe ;
- séquenceur extensible, piano-roll KEYS, vélocité et durée ;
- lecture locale ou sortie MIDI vers la machine ;
- sauvegarde locale, bibliothèque de projets et export MIDI/JSON ;
- lecture en mode Song à partir des scènes et patterns décodés.

### Clone & bibliothèque sonore

- scan SysEx strictement en lecture seule ;
- copie locale des 9 projets, PCM et métadonnées ;
- hashes SHA-256, reprise et écritures disque atomiques ;
- synchronisation incrémentale et historique des manifestes ;
- lecture des samples du clone lorsque l'EP-133 est déconnecté.

La validation réelle du 10 août 2026 a reconnu **9 projets et 527 sons
inchangés en 30,7 secondes**, sans téléchargement ni erreur. Les 536 hashes ont
été vérifiés indépendamment.

### Rhythm Hero — module inclus

Le coach historique reste disponible comme outil secondaire : 39 styles,
cinq niveaux, partition animée, score PERFECT / GOOD / MISS et jeu sur les pads
réels. Il ne définit plus l'identité principale du dépôt.

## Installation rapide

Prérequis : Node.js récent, npm et Chrome/Chromium pour Web MIDI.

```bash
git clone https://github.com/propann/ep133-ko-ii-studio.git
cd ep133-ko-ii-studio
npm ci
npm run dev
```

Ouvrir ensuite l'adresse indiquée par Vite, généralement
`http://localhost:5173/`.

```bash
npm test
npm run build
```

Pour le scan et le clonage matériel, suivre le guide
[Pont local de clonage](docs/PONT_LOCAL_CLONAGE.md). Le player autonome
historique reste disponible dans `docs/ep133-pad-player.html` pendant la
migration de ses exercices.

## État du projet

Le Studio, le Save/Load, la lecture des archives `.pak/.ppak`, le miroir
hors ligne, le clonage incrémental et la hiérarchie complète Patterns/Scènes/Song
(vues Pattern Editor et Song Arranger) sont opérationnels. Restent notamment à
faire : lecture automatique d'une Song Position à la suivante, édition avancée de
la vélocité/gate, service local automatique, préparation audio et écriture
matérielle sécurisée.

- [État détaillé](docs/ETAT_DU_PROJET.md)
- [Feuille de route](docs/ROADMAP.md)
- [Journal d'implémentation](docs/SUIVI_IMPLEMENTATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Validation du clone réel](docs/VALIDATION_CLONE_REEL.md)
- [Point d'étape Sons & Transfert](docs/POINT_SONS_ET_TRANSFERT.md)
- [Contexte et décisions](PROJECT_CONTEXT.md)

## Organisation

- `src/` — Studio React, audio, MIDI, diagnostic, scoring et projets ;
- `public/` — exercices, données publiques et sources MIDI ;
- `docs/` — architecture, validations et guides ;
- `exercises/` — parcours pédagogique et catalogue ;
- `handbook/` — atlas de finger-drumming ;
- `tools/` — scanners, cloneur, pont local et vérifications.

## Sécurité et données

- lecture seule par défaut lors des échanges SysEx ;
- aucun sample propriétaire n'est versionné dans Git ;
- les clones restent dans un dossier privé choisi par l'utilisateur ;
- aucune suppression ou restauration matérielle automatique ;
- les formats inconnus sont préservés, jamais inventés.

## Licence

Code du projet sous licence MIT, sauf mention contraire pour une dépendance.

Teenage Engineering, EP-133 et K.O. II sont des marques de leurs propriétaires.
Ce projet n'est ni affilié ni approuvé par Teenage Engineering.
