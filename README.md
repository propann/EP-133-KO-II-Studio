# EP-133 Rhythm Hero

[Français](README.md) · [English](README.en.md) · [Español](README.es.md)

**Apprendre, jouer, composer et sauvegarder — avec ou sans EP-133.**

EP-133 Rhythm Hero est une suite locale et open source dédiée au Teenage
Engineering EP-133 K.O. II. Elle réunit un coach de finger-drumming, un Studio
sur quatre groupes, une bibliothèque sonore hors ligne et un système de clonage
en lecture seule.

> Projet communautaire indépendant. Aucune écriture vers la machine n'est
> activée tant que les protections de sauvegarde, confirmation et relecture ne
> sont pas terminées.

## Reprise par une autre IA

Plusieurs agents travaillent sur ce dépôt. Lire d'abord [la passation
complète](docs/AI_HANDOFF.md) : état réel, contraintes, matériel et prochaine
mission, avant toute modification.

## Pourquoi ce projet ?

L'objectif est de rendre l'apprentissage et la création plus visuels : choisir
un rythme, voir les pads à frapper, jouer sur la vraie machine, mesurer son
avance ou son retard, puis transformer ses idées en morceaux sauvegardables.
L'application reste utilisable lorsque l'EP-133 est déconnecté.

## Fonctionnalités

### Rhythm Hero

- 39 styles rythmiques et cinq niveaux de difficulté ;
- partition multi-mesures avec pads et doigtés conseillés ;
- Web MIDI, score PERFECT / GOOD / MISS, combo et précision ;
- compte à rebours, tempo réglable et sons d'entraînement ;
- éditeur d'exercices USER à longueur extensible.

### Studio EP-133

- quatre groupes A–D et 12 pads par groupe ;
- séquenceur extensible, piano-roll KEYS, vélocité et durée ;
- lecture locale ou sortie MIDI vers la machine ;
- sauvegarde locale, bibliothèque de projets et export MIDI/JSON ;
- lecture en mode Song à partir des scènes et patterns décodés.

### Miroir privé de la machine

- scan SysEx strictement en lecture seule ;
- copie locale des 9 projets, PCM et métadonnées ;
- hashes SHA-256, reprise et écritures disque atomiques ;
- synchronisation incrémentale et historique des manifestes ;
- lecture des samples du clone lorsque l'EP-133 est déconnecté.

La validation réelle du 10 août 2026 a reconnu **9 projets et 527 sons
inchangés en 30,7 secondes**, sans téléchargement ni erreur. Les 536 hashes ont
été vérifiés indépendamment.

## Installation rapide

Prérequis : Node.js récent, npm et Chrome/Chromium pour Web MIDI.

```bash
git clone https://github.com/propann/ep133-rhythm-hero.git
cd ep133-rhythm-hero
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

Le jeu, le Studio, le Save/Load, la lecture des archives `.pak/.ppak`, le miroir
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

- `src/` — application React, audio, MIDI, scoring et projets ;
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
