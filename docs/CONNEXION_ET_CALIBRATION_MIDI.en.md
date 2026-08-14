# EP-133 MIDI connection and calibration

This guide checks what the EP-133 actually sends and maps its pads to the game without assuming the device's MIDI notes.

## Requirements

- EP-133 K.O. II connected directly to the computer by USB;
- recent Chrome or Chromium;
- application open at `http://localhost:5173/`;
- local server started with `npm run dev -- --host 0.0.0.0`.

Web MIDI requires browser permission. On another machine on the network, some browsers reject Web MIDI on an unsecured HTTP address. For the first hardware test, use `localhost` on the computer physically connected to the EP-133.

## Check the connection

1. Turn on the EP-133 and wait for it to finish starting.
2. Reload the page after connecting the USB cable.
3. Click **MIDI Connection** in the upper-right corner.
4. Accept the browser permission request.
5. Hit a pad on the device.

The application explicitly opens each MIDI input before installing its listener. The button should then show `Connected: EP-133 MIDI 1`.

The **Live MIDI diagnostics** panel should show the input name, channel, note, and velocity. This raw observation is shown even when the pad is not yet mapped to the game.

## Troubleshooting: “NOT CONNECTED” persists

Checked on August 12 with the real device connected by USB (`lsusb`: Teenage Engineering EP-133, `amidi -l`: `EP-133 MIDI 1`): the most likely cause is **not** an application bug. `requestMIDIAccess({ sysex: true })` requests two separate Chrome permissions — basic MIDI access and full SysEx access. Tested with Playwright while granting only `midi-sysex`: Chrome still refuses (`NotAllowedError: Permission to use Web MIDI API was not granted.`) until **both** `midi` and **midi-sysex** are granted. Once both are granted, the connection succeeds immediately: `EP-133 MIDI 1` appears as both input and output, and the button changes to `MIDI CONNECTED ✓`.

If “NOT CONNECTED” persists after clicking **MIDI Connection** and **Allow** in the browser prompt:

1. Open Chrome's permission icon in the address bar (the lock or dedicated icon to the left of the URL) and check that **Full MIDI (SysEx)** is set to *Allow*, not only **MIDI**.
2. If the site was denied by mistake the first time, Chrome will not ask again automatically — reset the permission explicitly (site settings, or the permission icon → reset), then reload the page and click **MIDI Connection** again.
3. `chrome://settings/content/midiDevices` lists sites allowed or blocked for Web MIDI SysEx — check that the origin in use (`localhost:...` or the network IP) is not explicitly blocked.

## Automatic mapping of the 12 pads

The application grid follows the EP-133's physical layout: four horizontal rows of three pads. It keeps this layout on narrow screens so a width change cannot move the pads.

No manual calibration is needed. The application applies Teenage Engineering's official table: A `36–47`, B `48–59`, C `60–71`, D `72–83`. Within each group, notes are automatically placed in the physical order `7 8 9 / 4 5 6 / 1 2 3 / . 0 ENTER`.

## Test the game

1. finish calibration;
2. click **Start session**;
3. hit the pads in time;
4. check the PERFECT, GOOD, MISS, and COMBO results;
5. stop the session before changing the mapping.

## Selected audio routing

- The EP-133 is used only as a MIDI input.
- No MIDI OUT message is sent back to the device.
- The browser produces the metronome and pad sounds.
- The first beat of each measure uses a higher click; the other three beats use a lower click.
- The EP-133's incoming velocity controls the volume of the sound played by the computer.
- The **PLAY** button first runs one empty four-beat count-in measure. The notation starts on the following measure to leave time to prepare.
- During play, the computer also quietly plays the model notation; player hits remain louder.

This routing avoids hearing the EP-133's internal sound together with a delayed copy from the game. For testing, listen to the computer's audio output.

## Adjust pad sounds

Double-clicking a virtual pad opens its mini mixer. Three settings are available separately for each pad: model volume, player volume, and pitch. The **Listen** button previews the sound even when the session is stopped. A single click on the pad remains a quick test or virtual hit.

During playback, the notation window scrolls automatically to keep the active step visible. The pads are framed by two compact VU meters: notation sound in orange on the left and player sound in amber on the right. The top-bar selector provides access to all 39 catalogue exercises.

The notation displays two measures side by side. Orange cells show expected hits and the cursor follows playback. Player hits are overlaid in the same cells as a colored mark: green for PERFECT, amber for GOOD, and red for MISS. This overlay avoids a second grid and leaves more room for playing.

## Quick diagnostics

### No MIDI input detected

- try another USB cable capable of carrying data;
- avoid USB hubs during diagnosis;
- close other software that may be monopolizing the MIDI port;
- disconnect, reconnect, and click MIDI connection again.

### The port appears but no hits are received

- check that the EP-133 is transmitting MIDI over USB;
- test another pad group;
- open the browser developer tools and record the error;
- note the browser, version, and operating system.

### Hits appear but the score does not change

- check that the pad shows a channel and note under its name;
- start the session before hitting;
- recalibrate the affected pad;
- check that two physical pads do not produce exactly the same channel/note pair in the current EP-133 mode.

## Information to record after testing

For each pad, record: group, position, channel, note, and observed minimum and maximum velocity. Also record the exact MIDI port name, browser, and any difference after changing groups or scenes on the EP-133.

## MACHINE TEST bench — temporary diagnostics from August 11, 2026

The **MACHINE TEST** page, available from the home screen, mirrors the physical layout and has two modes:

- **CONFIGURE**: click a control, then operate it on the device; the next message is associated with that control in `localStorage`;
- **TEST**: incoming messages highlight mapped controls, and messages on the learned channels can be replayed to the device.

This page requests Web MIDI with SysEx and deliberately listens to all inputs and all 16 channels. Studio and game views remain filtered to ports named EP-133 so the `Midi Through` problem cannot return.

### Official A–D group selection

Analysis of the public EP Sample Tool bundle and the MIT `kmorrill/ep-series-sysex` protocol shows that the official tool does not change groups with a note or CC. It uses the FILE SysEx protocol:

1. initialize FILE with event subscriptions;
2. read the `active` metadata of the `/projects` node (fid `2000`);
3. calculate the `groups` folder and the fid for group A, B, C, or D in the active project;
4. merge `{"active": groupFid}` into the `groups` folder;
5. read `active` again and compare it with the requested value.

For a project with fid `P`, the groups folder is `P + 100`, and groups A through D are `P + 200`, `P + 300`, `P + 400`, and `P + 500`. The browser implementation is limited to this interface metadata: it changes no project archive, pattern, sample, or pad assignment.

Real observation on August 11: the official tool log exposed `{"active":4000}` for the current project, `{"active":4500}` for its group D, and `{"active":4510}` for the active pad in group D. This confirms the project → group → pad separation and calculated fids on real hardware. The many responses containing `sym`, `sound.playmode`, `sample.start/end`, and similar fields came from EP Sample Tool metadata scanning, not from additional front-panel buttons.

### Temporary local capture

During hardware identification, Vite exposes `POST /__midi-capture` only in development. The page sends each raw observation there, and the server appends it to `tmp/ep133-midi-capture.ndjson`. The file is ignored by Git and never leaves the computer.

After mapping has been validated, remove:

- the `temporary-midi-capture` plugin from `vite.config.ts`;
- the two `fetch('/__midi-capture', ...)` effects from `MachineTestPage.tsx`;
- the `tmp/ep133-midi-capture.ndjson` entry from `.gitignore`;
- the local `tmp/` directory if it contains nothing else useful.

### Still required on a real EP-133

- exhaustive reception of every control's messages;
- A, B, C, and D device → page;
- A, B, C, and D page → device with correct `active` read-back;
- confirmation that musical content and samples are not modified.

A build or browser test is not hardware validation.
