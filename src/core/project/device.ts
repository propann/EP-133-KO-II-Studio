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

/** Un pad d'un projet ouvert qui attend un son (slot > 0) absent de la bibliothèque actuellement scannée. */
export interface MissingDependency {
  group: EditorGroup;
  pad: number;
  slot: number;
}

/**
 * Détection des dépendances manquantes (plan P1, REGISTRE_IDEES.md Q-13 —
 * « bibliothèque unifiée … et dépendances ») : à l'ouverture d'un projet, si
 * une machine est scannée, prévenir plutôt que de laisser un pad rester
 * silencieux sans explication à la lecture. Comparaison de métadonnées
 * seulement (le slot existe-t-il dans l'index sonore courant) — pas une
 * vérification que le SON RÉEL soit encore le même à ce numéro de slot,
 * qu'on ne peut pas savoir sans comparer les hashes audio eux-mêmes.
 */
export function findMissingDependencies(
  documentPads: Array<{ group: EditorGroup; pad: number; slot: number }>,
  soundIndex: DeviceSoundIndex | null,
): MissingDependency[] {
  if (!soundIndex) return [];
  const knownSlots = new Set(soundIndex.sounds.map((sound) => sound.slot));
  return documentPads.filter((pad) => pad.slot > 0 && !knownSlots.has(pad.slot));
}
