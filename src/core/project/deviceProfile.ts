export const DEVICE_PROFILE_KEY = 'ep133-rhythm-hero:device-profile:v1';

export interface DeviceProfile {
  name: string;
  capacityMb: 64 | 128;
  sampleFolderName: string;
  localSampleCount: number;
  updatedAt: string;
}

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
