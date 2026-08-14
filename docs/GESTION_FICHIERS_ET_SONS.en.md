# File and sound management

## Goal

Create, save, load, and audition a project with or without an EP-133, then prepare a verifiable hardware transfer.

## Planned formats

| Format | Role | Device write |
|---|---|---|
| `ep.project.v1.json` | description for the EP compiler | no |
| `.mid` | note exchange with a DAW | no |
| `.ppak` | compiled EP project/save | explicit import |
| sound package + manifest | prepared audio and dependencies | explicit transfer |

There will be no proprietary Rhythm Hero composition format. JSON is the readable source before compilation, MIDI is the musical exchange format, and `.pak/.ppak` remains the device format. See `DECISION_FORMATS_PROJET.md`.

## FILE menu

The `SAVE` menu contains New, Save, Save As, Open `.pak/.ppak`, Import MIDI, Save a `.ppak` copy, Export MIDI or technical JSON, Duplicate as exercise, and History/Recovery. Delivered exercises are visible but protected and must be duplicated before editing.

## Two sound banks

### Computer

Free or user sounds actually available in the browser, used for offline play and preparation.

### Device mirror

Starts with SysEx metadata. Audio is retrieved only on request and remains private in local storage. A pad keeps a logical reference such as `soundId`, a computer asset hash, an EP-133 slot, and an explicit built-in fallback.

## Transfer preparation

1. Read device identity and memory.
2. Scan slots without writing.
3. Convert the sound in a temporary workspace.
4. Show final size, free memory, and proposed slot.
5. Preview the converted file.
6. Create a backup if the target is occupied.
7. Ask for confirmation containing the exact slot number.
8. Transfer alone, without another concurrent FILE session.
9. Read back and compare content and metadata.
10. Update the cache only after validation.

## Rights constraints

The repository must not contain or automatically export the manufacturer's sound bank. Local sound copies remain the owner's responsibility. Sounds shipped with the app must be free or created for the project, with their license documented.
