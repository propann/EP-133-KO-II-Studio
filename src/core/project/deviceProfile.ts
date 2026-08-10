/**
 * Profil local de la machine et manifeste du premier instantané de clone,
 * persistés dans `localStorage` (pas dans le clone disque lui-même — voir
 * `src/core/storage/localFolders.ts` pour ça). Sert d'identité stable pour
 * nommer le dossier `clone/<nom-machine>/` et pour préparer la future Time
 * Machine incrémentale.
 */
export const DEVICE_PROFILE_KEY = 'ep133-rhythm-hero:device-profile:v1';
export const DEVICE_CLONE_KEY = 'ep133-rhythm-hero:device-clone:v1';

/** Identité déclarée de la machine par l'utilisateur (nom, capacité mémoire), pas lue depuis le matériel. */
export interface DeviceProfile {
  name: string;
  capacityMb: 64 | 128;
  sampleFolderName: string;
  localSampleCount: number;
  updatedAt: string;
}

/** Relit le profil sauvegardé ; renvoie `null` si absent ou corrompu (jamais d'exception). */
export function loadDeviceProfile(storage: Pick<Storage, 'getItem'>): DeviceProfile | null {
  try {
    const profile = JSON.parse(storage.getItem(DEVICE_PROFILE_KEY) || 'null') as Partial<DeviceProfile> | null;
    if (!profile || typeof profile.name !== 'string' || (profile.capacityMb !== 64 && profile.capacityMb !== 128)) return null;
    return { name: profile.name, capacityMb: profile.capacityMb, sampleFolderName: profile.sampleFolderName || '', localSampleCount: profile.localSampleCount || 0, updatedAt: profile.updatedAt || '' };
  } catch { return null; }
}

export function saveDeviceProfile(storage: Pick<Storage, 'setItem'>, profile: Omit<DeviceProfile, 'updatedAt'>): DeviceProfile {
  const saved = { ...profile, name: profile.name.trim() || 'MON EP-133', updatedAt: new Date().toISOString() };
  storage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(saved));
  return saved;
}

/**
 * Instantané local minimal du clone : ce que l'app sait AVANT que le pont
 * local (`tools/local_clone_bridge.py` + `tools/clone_ep133_readonly.py`)
 * n'ait réellement copié les PCM sur le disque. `audioStatus` reste
 * `'local-bridge-required'` tant que ce clone complet n'a pas tourné — l'UI
 * ne doit jamais prétendre l'avoir fait avant ce retour confirmé.
 */
export interface DeviceCloneManifest {
  createdAt: string;
  profile: DeviceProfile;
  soundCount: number;
  usedBytes: number;
  scannedProject: number | null;
  audioStatus: 'metadata-only' | 'local-bridge-required';
  history: Array<{ createdAt: string; label: string }>;
}

/** Écrit le manifeste initial du clone en localStorage (pas encore l'audio, voir `DeviceCloneManifest`). */
export function createDeviceClone(storage: Pick<Storage, 'setItem'>, profile: DeviceProfile, soundCount: number, usedBytes: number, scannedProject: number | null): DeviceCloneManifest {
  const createdAt = new Date().toISOString();
  const clone = { createdAt, profile, soundCount, usedBytes, scannedProject, audioStatus: 'local-bridge-required' as const, history: [{ createdAt, label: 'INSTANTANÉ INITIAL' }] };
  storage.setItem(DEVICE_CLONE_KEY, JSON.stringify(clone));
  return clone;
}
