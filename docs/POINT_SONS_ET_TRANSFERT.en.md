# Status — Sounds & Transfer

## Purpose

The Sounds & Transfer page explains the device before presenting file operations. Its key relationship is group → pad → slot → sound bank.

## Principles from the manual

The local OS 2.0 manual confirms:

- four A–D groups;
- twelve sounds/pads per group;
- choosing a group and then a pad before assigning a sound;
- ranges 001–099 Kicks, 100–199 Snares, 200–299 Hi-hats, 300–399 Percussion, 400–499 Bass, and 500–599 Melodic;
- global memory for up to 999 samples, within the device capacity.

The interface follows these relationships without copying protected illustrations, icons, or pages.

## Current organization

- main surface split into Groups & Pads and the bank browser;
- A–D groups always visible with their populated-pad count;
- groups arranged vertically on the left, like the device;
- 12 pads in a physical 3 × 4 grid: `7 8 9 / 4 5 6 / 1 2 3 / · 0 ENTER`;
- selected pad visible directly on the grid;
- a hit on a connected EP-133 selects its group and lights its pad;
- virtual pads use EP-133 output first, then cloned PCM, then a local fallback synth;
- one KEYS button switches the selected pad between ONE and KEYS in the shared local Studio project;
- all sound folders appear as buttons; the active folder opens its list;
- searchable inventory by slot or name;
- DELETE is visible per sound, but hardware action stays locked until checkpoint, slot backup, and read-back exist;
- profile, memory, MIDI connection, and clone folder remain available;
- WAV transfer stays disabled until a safe chain exists.

## Bank color code

| Bank | Range | Functional color |
|---|---:|---|
| Kick | 001–099 | red-orange |
| Snare | 100–199 | light orange |
| Hi-hat | 200–299 | yellow |
| Percussion | 300–399 | plum |
| Bass | 400–499 | deep blue |
| Melodic | 500–599 | muted green |
| FX / User | 600–699 | purple |
| User 1 | 700–799 | petrol blue |
| User 2 | 800–899 | light brown |
| User 3 | 900–999 | grey |

Only the first six ranges are named by the manual. The 600–999 ranges are application work areas, not official EP-133 names.

## Synchronization preparation

A sound can be dragged onto a pad. The assignment remains local; the pad and sound stay orange. Bank buttons show occupancy, the meter compares current and theoretical memory, and reassigning an existing sound adds zero bytes. `SYNCHRONIZE` summarizes and confirms the plan but does not yet write to the device.

Writing still requires loading the device project as a base, changing the pad/slot field without losing unknown bytes, compiling the archive, creating a checkpoint, requesting confirmation, writing a draft project, then reading it back and comparing it. The complete path is not yet validated in Rhythm Hero.

## Personal library

The page now manages both machine and personal samples. Groups & Pads occupy the full-width top band; machine banks and the personal library sit side by side below. A personal sound can be dragged to a pad or to a machine-bank row marked **PROPOSED PERSONAL SOUND**. `SYNCHRONIZE` copies pending files to `<working-folder>/a-importer/`, but still never writes directly to the EP-133.

Each machine-bank row has a preview button. It uses `machineSampleBank` by slot and shows an honest message when the working clone folder is unavailable instead of silently synthesizing a raw slot.

## Validation

Engine, transport, format, group-boundary, MIDI-to-pad, build, and diff checks pass. Visual validation remains to be performed in Chrome/Chromium on wide and narrow screens. No build or browser test is hardware validation.
