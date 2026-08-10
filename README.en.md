# EP-133 Rhythm Hero

[Français](README.md) · [English](README.en.md) · [Español](README.es.md)

**Learn, perform, compose, and back up — with or without an EP-133.**

EP-133 Rhythm Hero is a local, open-source suite built for the Teenage
Engineering EP-133 K.O. II. It combines a finger-drumming coach, a four-group
Studio, an offline sound library, and a read-only machine cloning system.

> Independent community project. Writing to the device remains disabled until
> backup, confirmation, and read-back safeguards are complete.

## Why this project?

The goal is to make learning and creation more visual: choose a rhythm, see
which pads to hit, perform it on the real device, measure early and late hits,
then turn ideas into saved compositions. The application remains useful when
the EP-133 is disconnected.

## Features

### Rhythm Hero

- 39 rhythm styles with five difficulty levels;
- multi-bar notation with pad numbers and suggested fingering;
- Web MIDI, PERFECT / GOOD / MISS scoring, combos, and accuracy;
- count-in, adjustable tempo, and practice sounds;
- unlimited-length USER exercise editor.

### EP-133 Studio

- four A–D groups with 12 pads per group;
- expandable sequencer, KEYS piano roll, velocity, and duration;
- local playback or MIDI output to the device;
- local saves, project library, and MIDI/JSON export;
- Song-mode playback from decoded scenes and patterns.

### Private device mirror

- strictly read-only SysEx scanning;
- local copies of all 9 projects, PCM files, and metadata;
- SHA-256 hashes, resumable operation, and atomic disk writes;
- incremental synchronization and manifest history;
- offline playback of cloned samples when the EP-133 is disconnected.

The real-device validation on August 10, 2026 recognized **9 unchanged projects
and 527 unchanged sounds in 30.7 seconds**, with no downloads or errors. All 536
hashes were independently verified.

## Quick start

Requirements: a recent Node.js version, npm, and Chrome/Chromium for Web MIDI.

```bash
git clone https://github.com/propann/ep133-rhythm-hero.git
cd ep133-rhythm-hero
npm ci
npm run dev
```

Open the address printed by Vite, usually `http://localhost:5173/`.

```bash
npm test
npm run build
```

For hardware scanning and cloning, see the French
[local clone bridge guide](docs/PONT_LOCAL_CLONAGE.md). The historical standalone
player remains available at `docs/ep133-pad-player.html` while its exercises are
migrated.

## Project status

The game, Studio, Save/Load workflow, `.pak/.ppak` reading, offline mirror,
incremental cloning, and the full Pattern/Scene/Song hierarchy (Pattern Editor
and Song Arranger views) are operational. Remaining work includes automatic
playback advance from one Song Position to the next, advanced velocity/gate
editing, automatic local service startup, audio preparation, and safeguarded
device writing.

- [Detailed status — French](docs/ETAT_DU_PROJET.md)
- [Roadmap — French](docs/ROADMAP.md)
- [Implementation log — French](docs/SUIVI_IMPLEMENTATION.md)
- [Architecture — French](docs/ARCHITECTURE.md)
- [Real clone validation — French](docs/VALIDATION_CLONE_REEL.md)
- [Context and decisions — French](PROJECT_CONTEXT.md)

## Repository layout

- `src/` — React app, audio, MIDI, scoring, and project modules;
- `public/` — exercises, public data, and MIDI sources;
- `docs/` — architecture, validation reports, and guides;
- `exercises/` — learning path and catalog;
- `handbook/` — finger-drumming atlas;
- `tools/` — scanners, clone engine, local bridge, and checks.

## Safety and data

- read-only by default for SysEx operations;
- no proprietary samples are committed to Git;
- clones remain in a private folder selected by the user;
- no automatic device deletion or restoration;
- unknown formats and fields are preserved, never guessed.

## License

Project code is licensed under MIT unless a dependency states otherwise.

Teenage Engineering, EP-133, and K.O. II are trademarks of their respective
owners. This project is neither affiliated with nor endorsed by Teenage
Engineering.
