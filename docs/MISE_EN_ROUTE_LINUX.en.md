# Linux setup

Linux is the main computer for playing and testing EP-133 K.O. II MIDI.

## One-time installation

```bash
sudo apt update
sudo apt install -y git python3 alsa-utils
git clone https://github.com/propann/ep133-ko-ii-studio.git
cd ep133-ko-ii-studio
chmod +x tools/start-linux.sh tools/check-ep133-linux.sh
```

## Start the player

Connect the K.O. II with a USB-C data cable, then run:

```bash
cd ~/ep133-ko-ii-studio
./tools/start-linux.sh
```

The player opens `http://127.0.0.1:8787/docs/ep133-pad-player.html`. Keep the terminal open; `Ctrl+C` stops it.

## Check the K.O. II

```bash
./tools/check-ep133-linux.sh
```

Expected output includes `2367:8020 Teenage Engineering EP-133` over USB and, depending on the system, an ALSA MIDI port.

## Role of the Linux PC

The Linux PC hosts the player and receives MIDI directly from the K.O. II. This is where real mapping, timing, and scoring will be added. The Raspberry Pi remains useful as a network lesson station, but it cannot replace the PC while the K.O. II is connected to the PC.
