# EP-133 technical reference — MIDI, SysEx, and samples

> Working document based on real EP-133 validation, local Studio code, and public community projects. It does not replace hardware validation. Write operations remain disabled until checkpoint, read-back, and recovery are verified.

## Sources studied

- [EP-133 Sample Tool](https://github.com/garrettjwilke/ep_133_sample_tool);
- [EP-133 MIDI SysEx Thingy](https://github.com/garrettjwilke/ep_133_sysex_thingy);
- [pbarilla/ep_133_sample_tool](https://github.com/pbarilla/ep_133_sample_tool);
- MIT [kmorrill/ep-series-sysex](https://github.com/kmorrill/ep-series-sysex), used by the read-only scanner;
- [icherniukh/ep133-krate](https://github.com/icherniukh/ep133-krate), independently confirming signed little-endian PCM packed with the same **Packed7** encoding as `pack7`/`unpack7`.

Community repositories are observation references, not compatibility guarantees for every firmware version. Their `.syx` files may delete, replace, or modify device content.

## Detection and identification

The universal MIDI Identity request is:

```text
F0 7E 7F 06 01 F7
```

The standard response begins `F0 7E 7F 06 02 ... F7`. The tool pairs the matching input and output, then sends a proprietary greeting. In the browser, `requestMIDIAccess` may require a user gesture. Studio filters ports containing `EP-133` so notes are never sent to `Midi Through`.

Observed Teenage Engineering messages usually use:

```text
F0 00 20 76 33 40 ... F7
```

`F0` starts SysEx, `00 20 76` is the Teenage Engineering manufacturer id, `33` identifies the observed EP-133/EP Series family, `40` is the Sample Tool protocol, and `F7` ends the message. FILE exchanges use the same family with a two-byte request id and command `05`.

## Transport and encoding

Binary data is packed in groups of seven bytes: a flags byte records original bit 7 values, then the seven values are sent with bit 7 cleared. Studio already has equivalent `pack7` and `unpack7` helpers. Request ids are 12-bit values used to match responses. Transfers may produce intermediate responses, so a long timeout is required.

Spontaneous SysEx events have no request id and are delivered to the MIDI interface. This matters for physical A–D buttons: a received notification must update the local React group without being sent back, or it could create a loop. Mapping must verify the TE prefix, event type, active project, and read-back `active` value; one guessed byte is not enough.

## Observed commands

FILE initialization subscribes to events after MIDI Identity and must not be sent by Studio until the user explicitly starts a diagnostic session. General commands include `GREET` (`1`) for device metadata, `ECHO` (`2`) for round-trip checks, `DFU` (`3`, dangerous bootloader operations), and product-specific commands (`127`). DFU must remain outside the UI.

For a project fid `P`, the observed FILE hierarchy is `projects: 2000`, `groups: P + 100`, group A: `P + 200`, B: `P + 300`, C: `P + 400`, and D: `P + 500`.

The current A–D selection reads `active`, writes the group metadata, then reads it again. This is the only connected metadata write and remains protected by read-back safeguards. No pattern, sample, archive, or unknown field is written.
