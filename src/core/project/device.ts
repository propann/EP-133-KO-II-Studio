import type { EditorGroup } from './exporters';

export interface DeviceInventory {
  readOnly: boolean;
  scannedAt: string;
  project: number;
  projectName?: string;
  pads: Array<{
    group: EditorGroup;
    pad: number;
    slot: number;
    playMode: number;
    rootNote: number;
  }>;
  sounds: Record<string, {
    name: string;
    playMode?: string;
    rootNote?: number;
    bpm?: number;
  }>;
}

export interface DeviceSoundIndex {
  readOnly: boolean;
  scannedAt: string;
  soundCount: number;
  usedBytes: number;
  sounds: Array<{ slot: number; bytes: number; flags: number; fileName: string }>;
}
