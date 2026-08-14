# Sequencer data model

## Native pattern length

The EP-133 OS 2.0 manual confirms that `LN.1` means a one-bar pattern and that each group accepts a length up to `LN.99`. In `ep.project.v1`, every pattern keeps this value explicitly in `bars`. It must not be recalculated only from the last note: an empty or deliberately longer pattern still has a length.

The value is independent for every group/pattern pair. The real validation project demonstrates this with `A01 = LN.2`, `C01 = LN.1`, and `C02 = LN.4`. A scene follows its longest group; the same length must never be copied arbitrarily to A, B, C, and D.

In the editor, each bar is 16 steps × 60 px. `LN.1`, `LN.2`, and `LN.4` therefore measure 960, 1920, and 3840 px before scrolling. The navigation reserve is added after the real bars and never replaces the selected `LN` length.

## Why this model exists

The educational game and Studio previously shared a minimal target shape: an id, time, and pad. Exports added fixed velocity and duration later. That prevented faithful MIDI round trips and left no good foundation for velocity, gate, and micro-timing editors.

## Canonical note

`src/core/project/model.ts` defines `SequencerNote`:

| Field | Role |
|---|---|
| `id` | stable event identity |
| `group` | EP-133 group A, B, C, or D |
| `beat` | quarter-note position, exactly convertible to 96 PPQN |
| `pad` | visual index 0–11 |
| `note` | optional MIDI pitch for KEYS |
| `velocity` | MIDI velocity 1–127 |
| `duration` | duration in quarter notes, minimum one tick at 96 PPQN |

`ProjectPatterns` always contains all four groups, even when empty. `emptyProjectPatterns()` is the only factory for this structure.

## Boundaries

Studio works with `SequencerNote` end to end. MIDI import creates these notes and preserves velocity and duration; MIDI export uses their real values; `ep.project.v1` converts position and duration to 96 PPQN. The game keeps its own `Target` type because its HIT/MISS scoring states must not contaminate a musical project.

## Above the note: PatternBank, Scene, Song

`src/core/project/song.ts` adds composition above the single-hit representation:

| Type | Role |
|---|---|
| `PatternBank` | `SequencerNote[]` for patterns 01–99 in every group; a key means a pattern exists, even if empty |
| `SceneDefinition` | one pattern per group (or `null` = MUTE) plus time signature, for scene 1–99 |
| `song: number[]` | ordered Song Positions, each containing a scene number |

`patternsForScene(bank, scenes, sceneNumber)` is the only bridge to `ProjectPatterns`. RhythmGrid, PianoRoll, PadStrip, and `createMidiFile` still operate on one flat scene at a time. `sceneIsUsed` follows the real decoder rule: a scene exports when at least one group is not MUTE.

The exporter writes the complete bank and all used scenes; the library reads them back instead of keeping only the first Song Position. See `STRUCTURE_SONG_MODE.md`.

## Compatibility and verification

Old exercises convert with velocity 100 and duration 0.25 quarter notes. Normalization limits velocity to 1–127 and duration to at least 1/96 note. `npm run test:exports` checks velocity and duration round trips, 48-tick conversion, old defaults, and normalization bounds.
