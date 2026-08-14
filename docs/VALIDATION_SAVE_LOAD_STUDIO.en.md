# Validation — Studio Save/Load

## Fixed problem

The full Studio `SAVE` button previously reused the educational exercise save. It kept only the visible group and closed the editor, so it was not a real Studio project.

## Current behavior

- `NEW` prepares an empty project with groups A, B, C, and D;
- `SAVE` serializes the complete project into the browser's local library;
- a second `SAVE` updates the open project instead of creating a duplicate;
- the selector and `OPEN` restore the selected project;
- the `FILE` menu contains New, Open, Save, Save As, Rename, Duplicate, Delete, and Export;
- a confirmation protects the displayed project before `NEW` or `OPEN` when it contains notes;
- the educational editor's `USER` save remains independent.

## Preserved data

The musical document uses the `ep.project.v1` intermediate contract. The local library adds only an identifier and an update date; it does not create a proprietary musical format.

Restoration preserves:

- name and tempo;
- notes for all four A–D groups;
- 96 PPQN position, pad, and melodic pitch;
- velocity and duration;
- ONE, KEYS, and LEGATO modes;
- pad information read from the device when available.

## Automated verification

`npm run test:exports` performs an in-memory round trip: document generation, local save, reload, and comparison of tempo, notes, groups, velocities, durations, and pad modes, including scenes, Song data, and native pattern lengths.

## August 12, 2026 audit — Save → quit → reopen

Two external audits requested that an imported and reopened project remain identical in every fixture. A real bug was found and fixed, rather than inferred from code review:

**Bug** — `serializePattern` (`exporters.ts`) wrote `note: target.note ?? 60` for every exported hit, including a simple ONE pad trigger with no melodic pitch. On reimport, that `60` became a real note:

- `toggleEditorPlayback` changed from `midi.sendPad(...)` to `midi.sendNote(60, ...)`, sending the wrong MIDI message to the device from the second playback onward;
- local PCM playback audibly transposed the sound when the pad's `rootNote` differed from 60;
- the Arranger preview classified the pattern as melodic instead of percussive.

**Fix** — `note` is written only when the hit actually has one. No invented default is exported. Old documents containing `note: 60` remain readable; only future exports stop inventing the field.

**Verified** — two assertions in `tools/check-project-exports.mjs` cover direct export and the `localStorage` round trip. They failed on the old code and pass after the fix.

## Remaining limits

- no `.pak/.ppak` file import from the interface yet (only `ep.project.v1` JSON);
- browser-only `localStorage` saves still need file download and backup autosave;
- undo/redo history for scenes and Song is not implemented yet (pattern editing already has it).
