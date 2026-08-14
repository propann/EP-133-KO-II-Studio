# Device sample bank in Studio

## Selection

The `FILE` menu has a separate `OPEN LOCAL BANK` entry. Select the device folder created at:

```text
chosen-folder/clone/device-name/
```

The browser reads `samples/` and `metadata/`. PCM files are matched by slot, for example `samples/324.pcm` with `metadata/324.json`.

Files are not uploaded to the site, a server, or GitHub. Studio receives temporary browser permission and reads them directly from the hard drive.

## Playback

- connected EP-133: Studio sends MIDI notes to the device;
- disconnected EP-133: Studio plays local clone PCM;
- no computer/device doubling;
- the piano roll applies MIDI pitch relative to the pad root note;
- velocity controls playback gain;
- STOP also cuts all active local PCM sources.

Samples are decoded on demand rather than loading 56.21 MB immediately. Supported native audio is signed 16-bit little-endian PCM, 46,875 Hz by default, mono or stereo according to metadata.

## Browser limitation

The selected folder is remembered across visits through IndexedDB (`src/core/storage/directoryHandleStore.ts`). On reload, the app silently reuses it while permission remains valid. Browsers may revoke permission; then an explicit RECONNECT button is offered instead of a silent failure.

## Also used by Sounds & Transfer

`machineSampleBank.play(slot, …)` is also used by the Sounds & Transfer page for each machine-bank preview button, addressed by slot rather than pad. See `POINT_SONS_ET_TRANSFERT.md`.
