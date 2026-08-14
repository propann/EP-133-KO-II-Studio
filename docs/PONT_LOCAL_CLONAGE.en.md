# Local cloning bridge

## Role

The web Studio cannot launch Python directly. The local bridge connects `LAUNCH COMPLETE CLONE` to the hardware engine while remaining limited to `127.0.0.1`.

It exposes:

- `GET /health`: availability and the root directory fixed at startup;
- `POST /clone/start`: start with a device name and 64/128 MB capacity;
- `GET /clone/status`: manifest, progress, and exit code.

The target path is never supplied by a web request. It is fixed when the bridge starts, so a page cannot request a write elsewhere.

## Current startup

```bash
/tmp/ep133-scan-venv/bin/python tools/local_clone_bridge.py \
  --root /home/azoth/Music/EP-133 --port 8765
```

Create the environment with `tools/requirements-scanner.txt`; it declares `epsysex`, `mido`, and the `python-rtmidi` backend needed for real MIDI input/output.

Vite redirects only `/bridge/*` to the local service. If the bridge is absent, the dialog keeps local-manifest mode and does not claim to launch a complete clone.

## Studio display

When the bridge responds, the dialog shows its root directory and the button becomes `LAUNCH COMPLETE CLONE`. After clicking:

- the button shows `CLONING…`;
- a bar shows phase, counter, and percentage;
- elapsed and estimated remaining time refresh every second;
- completion shows the error count;
- completion distinguishes changes from unchanged sounds;
- full details remain in `clone.log` and `manifest.json`.

When a clone already exists, the engine uses `incremental`, archives the previous manifest in `history/`, and avoids rewriting unchanged content. This remains strictly read-only on the EP-133 side.

## Current limit

The second pass from the button was validated on real hardware on August 10, 2026: 30.7 seconds, 9 unchanged projects, 527 unchanged sounds, no downloads, and no errors. The next step is installing the bridge as a user service started with the application, with clean shutdown and version detection.
