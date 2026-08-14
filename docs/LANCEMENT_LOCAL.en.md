# Start locally

The player is a static site: there is no database, account, or JavaScript dependency. Python only serves the files to the browser.

## Windows — the simplest option

1. Download or clone the repository.
2. Double-click `start-windows.cmd`.
3. Chrome or Edge automatically opens `http://127.0.0.1:8787/docs/ep133-pad-player.html`.
4. Close the small black window to stop the server.

`127.0.0.1` matters: when MIDI connectivity is added, Chrome/Edge allow the MIDI API on this local address.

## Raspberry Pi — local training server

On the Pi:

```bash
git clone https://github.com/propann/ep133-ko-ii-studio.git
cd ep133-ko-ii-studio
chmod +x tools/start-pi-local.sh
./tools/start-pi-local.sh
```

From another device on the same Wi-Fi network, open:

```text
http://PI_IP_ADDRESS:8787/docs/ep133-pad-player.html
```

To find the Pi's address:

```bash
hostname -I
```

The Pi is well suited to lessons, notation, and guide sounds on the local network. To analyze the K.O. II's USB-MIDI input, the first test must remain on the PC to which the device is connected, using `localhost`. A page served by the Pi over a local IP does not automatically receive MIDI from the PC.

## Quick check

- choose a level;
- choose 1 to 4 measures;
- start playback;
- hit the displayed pads;
- check that the player notation appears in amber.

## Verified technical status

| Item | Status |
|---|---|
| Standalone HTML player | OK |
| 39 exercises and difficulty levels | OK |
| Measures 1 to 4 and variations | OK |
| On-screen player notation | OK |
| Guide sound and VU meter | OK |
| Real USB MIDI / precise scoring | To be tested on the K.O. II |

The local server does not make the project “hosted”. It simply avoids browser restrictions and prepares the ground for local MIDI.
