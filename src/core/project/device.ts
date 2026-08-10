/**
 * Formes des scans SysEx en lecture seule produits par
 * `tools/scan_ep133_readonly.py` et `tools/scan_ep133_library_readonly.py`,
 * consommés côté app depuis `public/ep133-device.json` (inventaire du projet
 * scanné) et `public/ep133-sound-index.json` (index sonore global). Ces deux
 * fichiers ne contiennent jamais l'audio lui-même, seulement les métadonnées.
 */
import type { EditorGroup } from './exporters';

/** Inventaire des pads/sons d'UN projet EP-133 (9 projets max sur la machine, un seul scanné à la fois ici). */
export interface DeviceInventory {
  readOnly: boolean;
  scannedAt: string;
  /** Numéro du projet scanné (1–9). */
  project: number;
  projectName?: string;
  pads: Array<{
    group: EditorGroup;
    /** Numéro de pad interne 1–12 dans le groupe. */
    pad: number;
    /** Slot sonore global occupé par ce pad (0 = vide), voir `DeviceSoundIndex`. */
    slot: number;
    playMode: number;
    rootNote: number;
  }>;
  /** Métadonnées des sons référencés par les pads, indexées par numéro de slot en chaîne. */
  sounds: Record<string, {
    name: string;
    playMode?: string;
    rootNote?: number;
    bpm?: number;
  }>;
}

/** Index global des slots sonores de la machine (jusqu'à ~999 slots selon la notice, 527 utilisés lors de la validation réelle du 10 août 2026). */
export interface DeviceSoundIndex {
  readOnly: boolean;
  scannedAt: string;
  soundCount: number;
  usedBytes: number;
  sounds: Array<{ slot: number; bytes: number; flags: number; fileName: string }>;
}
