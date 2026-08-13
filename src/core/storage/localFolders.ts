/**
 * Accès natif au disque via la File System Access API de Chrome/Chromium —
 * jamais d'`<input type="file">` ni d'upload : les PCM du clone restent sur
 * le HDD choisi par l'utilisateur, seul le manifeste JSON transite en JS.
 * Utilisé par `MachineCloneDialog` pour écrire `clone/<nom-machine>/manifest.json`
 * et relire un dossier de clone existant depuis `MachineSampleBank`.
 */
export interface LocalDirectoryHandle {
  name: string;
  values(): AsyncIterableIterator<LocalFileHandle | LocalDirectoryHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<LocalDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<LocalFileHandle>;
}

interface LocalFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string | Blob | ArrayBuffer): Promise<void>; close(): Promise<void> }>;
}

const isDirectory = (handle: LocalDirectoryHandle | LocalFileHandle): handle is LocalDirectoryHandle => 'values' in handle;

/**
 * Ouvre le sélecteur de dossier natif. Rejette avec `AbortError` si
 * l'utilisateur annule — à filtrer par l'appelant.
 *
 * `mode` par défaut : `'read'`. Ne demander `'readwrite'` que là où on
 * écrit vraiment (le clone, via `writeCloneManifest`) — une simple lecture
 * (dossier de travail, banque de samples) n'a aucune raison de réclamer un
 * accès en écriture au disque de l'utilisateur.
 */
export async function chooseLocalDirectory(mode: 'read' | 'readwrite' = 'read') {
  const picker = (window as Window & { showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<LocalDirectoryHandle> }).showDirectoryPicker;
  if (!picker) throw new Error('Ce navigateur ne permet pas l’accès direct aux dossiers. Utilisez Chrome ou Chromium en local.');
  return picker({ mode });
}

/**
 * Aplati récursivement un dossier choisi en une liste de `File`, en
 * reconstituant `webkitRelativePath` (absent par défaut sur les fichiers
 * ouverts via File System Access) pour que `MachineSampleBank.load` puisse
 * reconnaître les chemins `samples/NNN.pcm` et `metadata/NNN.json` du clone.
 */
export async function collectLocalFiles(directory: LocalDirectoryHandle, prefix = ''): Promise<File[]> {
  const files: File[] = [];
  for await (const handle of directory.values()) {
    if (isDirectory(handle)) files.push(...await collectLocalFiles(handle, `${prefix}${handle.name}/`));
    else {
      const file = await handle.getFile();
      Object.defineProperty(file, 'webkitRelativePath', { configurable: true, value: `${prefix}${file.name}` });
      files.push(file);
    }
  }
  return files;
}

/** Nom de fichier/dossier sûr dérivé du nom de machine saisi par l'utilisateur (pas de validation matérielle). */
const safeName = (value: string) => value.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || 'mon-ep133';

/**
 * Écrit `manifest.json` dans `<dossier choisi>/clone/<nom-machine>/` —
 * jamais à la racine du dossier choisi, pour que plusieurs machines et
 * plusieurs générations de clones cohabitent proprement. Ne touche à aucun
 * PCM ; c'est `tools/clone_ep133_readonly.py` via le pont local qui les copie.
 */
export async function writeCloneManifest(parent: LocalDirectoryHandle, machineName: string, manifest: object) {
  const clone = await parent.getDirectoryHandle('clone', { create: true });
  const machine = await clone.getDirectoryHandle(safeName(machineName), { create: true });
  const file = await machine.getFileHandle('manifest.json', { create: true });
  const writable = await file.createWritable();
  await writable.write(`${JSON.stringify(manifest, null, 2)}\n`);
  await writable.close();
  return `${parent.name}/clone/${safeName(machineName)}/manifest.json`;
}

/**
 * Écrit la fiche personnage (identité, machines déclarées, stats cumulées)
 * à la racine du dossier de travail — pas dans `clone/<machine>/`, puisqu'un
 * seul profil peut déclarer plusieurs machines. Même philosophie que
 * `writeCloneManifest` : lisible par n'importe quel outil, jamais un
 * stockage propriétaire du navigateur ; sert de secours si `localStorage`
 * est vidé (nouveau navigateur, profil de test, nettoyage du site).
 */
export async function writePlayerProfile(parent: LocalDirectoryHandle, profile: object) {
  const file = await parent.getFileHandle('profile.json', { create: true });
  const writable = await file.createWritable();
  await writable.write(`${JSON.stringify(profile, null, 2)}\n`);
  await writable.close();
  return `${parent.name}/profile.json`;
}

/** Relit `profile.json` à la racine du dossier de travail, s'il existe. `null` si absent ou illisible — jamais d'exception, l'appelant décide quoi en faire. */
export async function readPlayerProfileFile(parent: LocalDirectoryHandle): Promise<unknown | null> {
  try {
    const file = await parent.getFileHandle('profile.json');
    return JSON.parse(await (await file.getFile()).text());
  } catch {
    return null;
  }
}
