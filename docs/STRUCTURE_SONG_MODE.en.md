# Song structure — EP-133 Song mode

## Functional source

Section 6.2 of the OS 2.0 manual describes four distinct levels:

1. a **project** is the song;
2. each A–D group has **patterns**, numbered 01 to 99;
3. a **scene** selects one pattern for each group;
4. a **Song Position** places a scene in the song order.

A Song Position lasts as long as the longest pattern in its scene. A list can contain up to 99 positions. This rule, rather than a reproduction of the manual illustration, guides our interface.

## The real model in Studio

Studio stores the complete hierarchy, not one fixed scene:

- `PatternBank` (`src/core/project/song.ts`) keeps every pattern 01–99 for every group. A gap (for example, no B01) is legal and preserved, never filled in, as confirmed by real device scans.
- `SceneDefinition[]` keeps every S.01–S.99 scene. Each scene selects a pattern per group or `null` (`MUTE`, or `0` on the device).
- `song: number[]` keeps the full L.01–L.99 list, the chronological order of the song. A scene is a shared resource: two Song Positions may reference the same scene, and editing it from either position changes both, matching the real device.

Two views use this model and can be switched with `[ EDIT PATTERN ] / [ ARRANGEMENT ]` in the Studio bar:

- **Pattern Editor**: the existing grid, with a `PATTERN: [ A01 ▲▼ ]` selector to choose which pattern number in the active group is edited.
- **Song Arranger** (`SongArranger.tsx`): a horizontal storyboard, one card per Song Position, showing the four group blocks from its scene with a schematic preview derived from hits, not audio. `[DUP]` creates an independent scene for variations without changing positions that share the source scene; `[DELETE]` removes the position without deleting a scene still used elsewhere. Drag and drop reorders positions and assigns a pattern from the pool to a group block.

Studio-only visual convention (not a confirmed hardware fact): in the Arranger, groups A/B/C/D are orange, yellow, charcoal, and grey (`--group-a/b/c/d` in `style.css`). Elsewhere, group color remains tied only to selection.

## Deliberate limitation

Playback is still limited to one scene at a time — auditioning a Song Position from the Arranger (`▶`) plays its scene in a simple loop. Automatic advance from one Song Position to the next during full-song playback **is not implemented**; it would require a broader transport redesign. The data model (patterns/scenes/song) is complete and imports/exports faithfully.

The official PDF and its illustrations are not redistributed. Only functional concepts and device references are reused.
