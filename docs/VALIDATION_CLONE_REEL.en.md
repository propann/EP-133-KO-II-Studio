# Validation of the first complete hardware clone

## Result

The `MY EP-133` clone was created on August 9, 2026 in a private folder:

```text
/home/azoth/Music/EP-133/clone/MY-EP-133/
```

Reading began at 21:27:38 UTC and ended at 21:52:58 UTC: **25 minutes and 20 seconds**.

| Item | Result |
|---|---:|
| TAR projects | 9 |
| PCM samples | 527 |
| JSON metadata | 527 |
| Audio | 56,214,010 bytes |
| Folder size | about 58 MB |
| Engine errors | 0 |

## Independent check — August 10, 2026

The manifest and files were reread: 536 SHA-256 hashes recomputed, no difference, no missing file, 527 metadata JSON files parsed successfully, and final manifest status `complete`. The backup is a valid local Studio base, remains private, and is not versioned in Git.

## Incremental validation

The Studio button now connects to the engine through the local bridge. A second pass from the button with the real EP-133 took 30.7 seconds:

| Item | Result |
|---|---:|
| Unchanged projects | 9 |
| Unchanged sounds | 527 |
| Downloaded bytes | 0 |
| Additions / changes / deletions | 0 |
| Errors | 0 |

The final manifest uses schema `ep133.rhythm-hero.clone.v2`, mode `incremental`, and status `complete`. An independent check again confirmed all 536 hashes and 527 valid metadata files.
