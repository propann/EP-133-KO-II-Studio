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
