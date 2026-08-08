# EP-133 Rhythm Hero

Interactive finger-drumming coach for the Teenage Engineering EP-133 K.O. II.

## Current milestone

- EP-133-inspired pad player
- 39 progressive rhythm exercises, organised from level 1 to level 5
- Visual one-bar notation with the pad number to play
- Recommended finger placement
- Tempo multiplier from 10% to 150%
- Basic training sounds and reactive old-school VU meter
- Printable finger-drumming booklet source

## Run the player

Open `docs/ep133-pad-player.html` in a recent Chromium-based browser.

> MIDI input and score validation are the next milestone. We will first capture and validate the real EP-133 MIDI mapping on the connected machine.

## Repository layout

- `docs/ep133-pad-player.html` - standalone player
- `src/ep133-pad-player.fragment.html` - editable interactive source
- `exercises/EP133_EXERCICE_01_BOOM_BAP.json` - exercise source example
- `handbook/EP133_ATLAS_FINGER_DRUMMING.md` - printable rhythm atlas source
- `tools/make_cahier_ep133.py` - generates the PDF booklet

## License

Project code: MIT, unless a future dependency states otherwise.

Teenage Engineering, EP-133 and K.O. II are trademarks of their respective owner. This is an independent community project.
