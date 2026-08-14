/** Sauvegarde de secours locale du brouillon Studio, distincte de la bibliothèque. */
export const STUDIO_AUTOSAVE_KEY = 'ep133-rhythm-hero:studio-autosave:v1';

export interface StudioAutosaveRecord {
  savedAt: string;
  document: Record<string, unknown>;
}

export function saveStudioAutosave(storage: Pick<Storage, 'setItem'>, document: Record<string, unknown>, savedAt = new Date().toISOString()) {
  const record: StudioAutosaveRecord = { savedAt, document };
  storage.setItem(STUDIO_AUTOSAVE_KEY, JSON.stringify(record));
  return record;
}

export function loadStudioAutosave(storage: Pick<Storage, 'getItem'>): StudioAutosaveRecord | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(STUDIO_AUTOSAVE_KEY) || 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Partial<StudioAutosaveRecord>;
    return typeof record.savedAt === 'string' && record.document && typeof record.document === 'object' && !Array.isArray(record.document)
      ? { savedAt: record.savedAt, document: record.document as Record<string, unknown> }
      : null;
  } catch {
    return null;
  }
}

export function clearStudioAutosave(storage: Pick<Storage, 'removeItem'>) {
  storage.removeItem(STUDIO_AUTOSAVE_KEY);
}
