# Architecture — local EP-133 mirror

## Chosen vision

When disconnected, the app works as an EP-133 working clone. When connected, the device is both the hardware source of truth and a MIDI control surface. The mirror never means publishing the manufacturer's bank; data and audio remain private on the owner's computer.

## First connection

The assistant must detect and identify the device, request a stable local name, choose declared 64/128 MB capacity, read observable capacity, choose a sample folder, inventory all 999 slots and projects, offer private audio copying separately, and create an immutable initial snapshot. The Studio exposes this through `FILE → CLONE THE DEVICE` and the required path `chosen-folder/clone/device-name/`.

## Three data layers

1. **Device base** — last confirmed read: identity, capacity, slots, metadata, projects, patterns, scenes, Song Positions, and settings. The editor never modifies it directly.
2. **Working copy** — editable offline state. Samples resolve from the profile's private folder; missing audio is reported and may use an explicitly selected computer fallback.
3. **Patch** — deterministic difference between base and working copy: additions, changes, moves, deletions, size, touched slots, free space, and dependent projects.

## Safe synchronization

A future device sync must re-read identity, detect device changes since the snapshot, stop on conflicts, create a recoverable checkpoint, show the patch and request confirmation, serialize writes without concurrent sessions, read every written element back, compare it, and only then update the device base. Writing remains locked until this chain is tested on a draft project and reserved slots.

## Control surface

Proven functions are enabled progressively: pads, velocity, groups, and MIDI transport first. Faders, mode keys, CCs, and display states require real captures. No fictional LCD mirror is presented as reliable hardware state.

## Time Machine roadmap

Named dated history and metadata comparison are implemented. Local restoration, return patches, hardware restoration after checkpoint/confirmation, and hash-based retention are not enabled. No restoration button is built or implied.

## Web-app limit

The browser can ask the user to choose a folder, read samples, and write the manifest locally, but it cannot freely run a complete SysEx scan. A secure local bridge or installable app is still required for the complete product; the web frontend remains the shared interface and editing engine.
