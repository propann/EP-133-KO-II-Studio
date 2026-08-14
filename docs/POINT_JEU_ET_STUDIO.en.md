# Status — Game and Studio

Date: August 9, 2026.

The application has two major sections sharing audio, MIDI, and pad information but serving different needs: the game stays immediate and educational; Studio can become denser and more precise.

## Rhythm Hero — learn and play

### Solid today

- MIDI connection without mandatory calibration, with notes 36–83 mapped;
- audible free play outside an exercise;
- one-bar count-in, preview mode, and real scoring sessions;
- distinct sounds on all 12 pads, model/player controls, and low latency;
- model notation and player hits overlaid with different colors;
- animated two-bar window and cursor tracking;
- PERFECT/GOOD/MISS thresholds, combo, and best combo tested;
- 39 styles and five levels without automatic tempo increase;
- five hand-written Boom-Bap levels; other styles are still being generated.

### Fragile areas

1. Expected notes missed at the end are not yet converted into MISS, so accuracy can be too generous.
2. Educational content is uneven; only Boom-Bap has five hand-composed levels.
3. Exercise generation remains in `App.tsx` and should move to a testable teaching module.
4. `ScoreView` always renders 32 steps/two bars; other time signatures need a more flexible display model.
5. The end report still needs per-pad timing, omissions, and learning progress.

Priority is to count missed notes, then produce styles in five-level blocks without turning the game screen into a DAW.

## EP-133 Studio — create and transfer

### Solid today

Four A–D groups, physical ordering of 12 pads, an expandable horizontal grid, ONE/KEYS modes, piano roll, canonical notes with position/pad/pitch/velocity/duration, PC and device playback, loop, cursor, MIDI clock, multi-group MIDI export, `ep.project.v1`, read-only `.pak/.ppak` and TAR reading, and separated visual components.

### Fragile areas

File import still needs interface wiring; velocity and duration are preserved but not graphically editable everywhere; pattern pools, scenes, Song, and full undo/redo continue to evolve; some state remains orchestrated in `App.tsx`.

The next safe Studio work is to secure the complete file lifecycle before adding deeper editing gestures.

## Original notation principles

Use three levels: black for context, grey for measure/grid/function, and orange only for cursor, selection, or immediate action. A selected note may show:

```text
NOTE  C3     VELOCITY  104
GATE  24T    POSITION  01:03:12
```

Keep the game simple: two bars, 12 tracks, and model/player overlays. Detailed velocity and gate controls belong in Studio.
