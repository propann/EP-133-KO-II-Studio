# Decision — project formats

Date: August 9, 2026  
Status: adopted

## Decision

The project will not create a proprietary Rhythm Hero composition format. User-facing files will belong to the EP-133 ecosystem or use standard MIDI.

## Selected formats

### `.ppak` and `.pak`

Device save and transfer formats. An existing file must be loaded as the base before editing so unknown fields are preserved.

### `.mid`

Exchange format for notes, tempos, and durations with DAWs. It contains neither samples nor every EP-133-specific setting.

### `ep.project.v1.json`

Readable technical description accepted by the open-source `ep-series-sysex` compiler. It is an intermediate representation for editing, testing, and compiling a project, not a competing musical format.

## Planned FILE menu

- open a `.pak/.ppak` save;
- import `.mid`;
- save a `.ppak` copy;
- export MIDI;
- export technical JSON for advanced diagnostics;
- send to a draft project after checkpoint and confirmation.

## Consequences

Game exercises can be converted to MIDI and EP-133 projects. Educational information remains in the internal catalogue and does not contaminate device files. No `.ppak` is advertised as valid before compilation, inspection, and testing in a saved project slot.

## Reader status

`src/core/project/importers.ts` supports MIDI formats 0 and 1, tempo, notes, velocity, durations, validation of `ep.project.v1`, and non-destructive inspection of `.pak/.ppak`, `meta.json`, TAR projects, and WAV sounds. Proven TAR structures are also decoded read-only: pads, notes, automation, scenes, Song, and tempo. Raw members and fields are preserved. SAVE integration remains separate so transport and file lifecycle can be tested first.
