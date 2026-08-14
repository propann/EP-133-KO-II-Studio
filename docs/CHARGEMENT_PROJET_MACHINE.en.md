# Loading device project 1

## Scan result

On August 9, 2026, project 1 was read from the EP-133 without any write command. The decoder found:

- tempo: 120 BPM;
- patterns: A01–A03, B02–B03, C01–C03, and D01–D03;
- three scenes: S.01, S.02, and S.03;
- Song mode: one `L.01` position referencing `S.01`;
- no decoding warnings.

`S.01` references A01, B01, C01, and D01. B01 does not exist in the archive, so group B is correctly shown empty. It must not be replaced with B02 or B03.

## Use in Studio

Open `FILE`, then choose `DEVICE PROJECT 1`. Studio loads the first Song Position and shows 25 events on A01, no events on B01 or C01, 6 events on D01, and two measures determined by the longest pattern. Loading does not modify the device. Create an editable copy with `SAVE AS`.

## Preparation chain

1. `tools/read_project.py` performs the hardware read into a local TAR;
2. `tools/export-ep133-project-snapshot.mjs` decodes the TAR;
3. only the readable musical document `public/ep133-project-1.json` is supplied to the interface;
4. no audio sample or raw binary archive is embedded in the site.

The JSON is a snapshot. To retrieve later device changes, run the read-only scan again.
