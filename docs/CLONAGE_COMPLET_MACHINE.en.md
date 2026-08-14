# Complete device clone

## Definition

A complete clone actually contains:

- all nine EP-133 projects as original TAR archives;
- every occupied audio slot as PCM;
- metadata for every slot;
- a SHA-256 hash for every project and sample;
- a global manifest with status, errors, and summary;
- the profile name and declared 64/128 MB capacity.

A simple JSON inventory is therefore not called a “complete clone”.

## Delivered engine

`tools/clone_ep133_readonly.py` performs this copy without writing anything to the device. It requires an explicit target directory and creates:

```text
chosen-folder/
└── clone/
    └── device-name/
        ├── manifest.json
        ├── clone.log
        ├── history/
        │   └── manifest-<date>.json
        ├── projects/
        │   ├── P01.tar
        │   └── … P09.tar
        ├── samples/
        │   ├── 001.pcm
        │   └── …
        └── metadata/
            ├── 001.json
            └── …
```

The `clone` directory is created automatically if it does not exist. If it already exists, it is reused without deletion. Each device must have its own normalized subdirectory so two devices cannot be mixed.

The manifest, projects, PCM files, and metadata are written atomically. When a previous manifest exists, it is archived in `history/` before synchronization. Isolated errors are recorded without making already copied data unusable.

Under the `ep133.rhythm-hero.clone.v2` schema, synchronization keeps projects whose local hash matches the latest manifest, and PCM files whose local size and hash match. Lightweight metadata is reread on every pass to detect changes without downloading the audio again. The summary distinguishes modified projects, added or modified sounds, unchanged sounds, and missing slots.

Known limitation: the device's file list does not expose a checksum for remote PCM. The engine therefore cannot recognize, without downloading again, a replacement audio file with exactly the same size and metadata. Files for missing slots remain on disk; their absence is reported without automatic deletion.

## Duration and progress

The first real clone of 527 sounds took **25 minutes and 20 seconds**. Announce a cautious **20 to 30 minute** range before the first copy. The cost comes mainly from SysEx read sessions, not only from the 56.21 MB transferred.

During the operation, the manifest exposes:

- the `projects` or `samples` phase;
- the current number and total;
- elapsed time;
- an estimated remaining time;
- errors already encountered.

The console displays each project and slot immediately. A resume is normally faster because PCM files already validated by the manifest and their local hash are not downloaded again.

### Hardware validation — August 9, 2026

- final status: `complete`;
- 9 projects on disk;
- 527 PCM files, totaling 56,214,010 bytes;
- 527 metadata files;
- no errors;
- total directory size: approximately 58 MB;
- destination: `Music/EP-133/clone/MY-EP-133/`.

Planned local execution:

```bash
/tmp/ep133-scan-venv/bin/python tools/clone_ep133_readonly.py \
  --out "/chosen/path" --name "MY EP-133" --capacity-mb 64
```

## Studio integration

The `FILE → CLONE THE DEVICE` dialog connects to the engine through the local HTTP bridge described in `PONT_LOCAL_CLONAGE.md`. The bridge fixes the parent directory when it starts, listens only on `127.0.0.1`, launches Python, and exposes progress without allowing the web page to choose another path.

The first complete clone is validated. Incremental synchronization and its history were also validated from the button using the real device: 30.7 seconds to recognize 9 unchanged projects and 527 unchanged sounds, with no download or error. All 536 hashes and the 527 metadata files were then checked independently.

## Time Machine preparation

The initial clone becomes the first checkpoint. Later snapshots will reuse files whose hashes are unchanged and store only new content. Restoring to the device remains a separate operation requiring a diff, an additional checkpoint, confirmation, and read-back.
