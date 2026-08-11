# EP-133 KO II Studio

[Français](README.md) · [English](README.en.md) · [Español](README.es.md)

**The open-source companion studio for the EP-133 K.O. II.**

EP-133 KO II Studio clones projects and sounds, opens real patterns, builds
scenes and Songs, works offline, and prepares verified changes for the device.
Everything stays local, inspectable, and account-free.

> **Machine → Studio → creation → machine.** This project goes beyond sample
> transfer to understand and reshape the music stored inside the EP-133.

> Independent community project. Reading, MIDI playing, and active A–D group
> selection are available; persistent project or sample writes remain locked
> until backup, confirmation, and read-back safeguards are validated.

## What the Studio does

- clones all 9 projects, PCM samples, metadata, hashes, and incremental history;
- reads `.pak/.ppak` projects, patterns, scenes, Songs, pads, and tempo;
- edits patterns, KEYS notes, pattern banks, scenes, and Song Positions;
- uses the connected EP-133, cloned samples, or the internal audio engine;
- provides safeguarded write preparation and full MIDI/SysEx diagnostics.

## Features

### Pattern & Song Studio

- four A–D groups with 12 pads per group;
- expandable sequencer, KEYS piano roll, velocity, and duration;
- local playback or MIDI output to the device;
- local saves, project library, and MIDI/JSON export;
- Song-mode playback from decoded scenes and patterns.

### Clone & sound library

- strictly read-only SysEx scanning;
- local copies of all 9 projects, PCM files, and metadata;
- SHA-256 hashes, resumable operation, and atomic disk writes;
- incremental synchronization and manifest history;
- offline playback of cloned samples when the EP-133 is disconnected.

The real-device validation on August 10, 2026 recognized **9 unchanged projects
and 527 unchanged sounds in 30.7 seconds**, with no downloads or errors. All 536
hashes were independently verified.

### Rhythm Hero — included module

The original trainer remains as a secondary tool: 39 styles, five levels,
animated notation, scoring, and input from the real pads.

## Quick start

Requirements: a recent Node.js version, npm, and Chrome/Chromium for Web MIDI.

```bash
git clone https://github.com/propann/ep133-ko-ii-studio.git
cd ep133-ko-ii-studio
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

The Studio, Save/Load workflow, `.pak/.ppak` reading, offline mirror,
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
