# EP-133 project reader validation

Date: August 9, 2026  
Mode: read-only  
Product: EP-133 K.O. II

## Goal

Verify the TypeScript decoder on a controlled synthetic TAR and then on a real copy of project 1 obtained through the read-only FILE protocol.

## Automated result

`npm run test:exports` builds and rereads a MIDI with multiple groups, tempo, velocity, and duration; a TAR containing a 26-byte pad, a pattern with a note and automation, a 712-byte `scenes` member, and tempo in `settings`; and a synthetic `.ppak` containing that TAR and a dummy WAV. Assertions compare all expected fields.

## Test-device result

Project 1 was copied to a temporary 68,096-byte file. The decoder found:

| Item | Value |
|---|---:|
| TAR members | 68 |
| Pads | 48 |
| Patterns | 11 |
| Notes | 125 |
| Automation | 0 |
| Defined scenes | 3 |
| Song Positions | 1 |
| Current scene | 3 |
| Tempo | 120 BPM |
| Warnings | 0 |

The real temporary file is not versioned because it may contain personal project data. No sound was downloaded and no write command was called.

## Guarantees and limits

Unknown TAR members remain byte-for-byte available in `members`; pads and decoded events retain their `raw` arrays; inconsistent sizes, counters, safety bytes, and automation ranges produce warnings; native 26-byte pads are accepted and 27-byte Sample Tool variants are reported cleanly. `fx_settings` and fader assignments are not yet exposed, unknown event types are preserved but not interpreted, the reader does not rewrite TARs or guarantee generated `.ppak`, and SAVE/LOAD does not yet use every reader function.
