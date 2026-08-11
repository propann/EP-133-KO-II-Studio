import type { LocalDirectoryHandle } from './localFolders';

/**
 * Un `FileSystemDirectoryHandle` ne tient pas dans `localStorage` (pas
 * sérialisable en JSON) mais IndexedDB sait le stocker tel quel — c'est la
 * seule façon standard de « se souvenir » d'un dossier choisi d'une visite
 * à l'autre sans redemander le sélecteur natif à chaque fois. Un seul
 * dossier de travail à la fois pour l'instant (clé fixe) ; la mémoire ne
 * survit que si l'utilisateur régénère la permission au retour (le
 * navigateur ne la garde jamais indéfiniment, voir `verifyStoredPermission`).
 */
const DB_NAME = 'ep133-rhythm-hero-handles';
const STORE_NAME = 'directories';
export const SAMPLE_FOLDER_KEY = 'sample-folder';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE_NAME); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDirectoryHandle(key: string, handle: LocalDirectoryHandle): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function loadDirectoryHandle(key: string): Promise<LocalDirectoryHandle | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve((request.result as LocalDirectoryHandle | undefined) || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function forgetDirectoryHandle(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Rien à oublier si IndexedDB est indisponible.
  }
}

type PermissionAware = LocalDirectoryHandle & {
  queryPermission?: (options: { mode: 'read' | 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission?: (options: { mode: 'read' | 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>;
};

/** Vérification silencieuse (pas de prompt) — sûre à appeler automatiquement au chargement d'une page. */
export async function hasStoredPermission(handle: LocalDirectoryHandle, mode: 'read' | 'readwrite'): Promise<boolean> {
  const aware = handle as PermissionAware;
  if (!aware.queryPermission) return true;
  try { return (await aware.queryPermission({ mode })) === 'granted'; } catch { return false; }
}

/** Redemande la permission — nécessite un vrai geste utilisateur (clic), sinon le navigateur rejette silencieusement. */
export async function requestStoredPermission(handle: LocalDirectoryHandle, mode: 'read' | 'readwrite'): Promise<boolean> {
  const aware = handle as PermissionAware;
  if (!aware.requestPermission) return true;
  try { return (await aware.requestPermission({ mode })) === 'granted'; } catch { return false; }
}
