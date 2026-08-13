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
  /** Méthode native de FileSystemDirectoryHandle, absente jusqu'ici — nécessaire
   * pour supprimer le fichier miroir d'un projet Studio supprimé de la bibliothèque. */
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
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

const STUDIO_PROJECT_EXT = '.ep.project.json';

/**
 * Écrit un projet Studio dans `<dossier de travail>/studio/<id>.ep.project.json`
 * — exactement le document `ep.project.v1` déjà utilisé par l'export/import
 * existant (`exportEditorProjectJson`/`importStudioProjectFiles`), donc le
 * fichier écrit ici est directement réimportable tel quel via le bouton
 * Importer si `localStorage` est un jour perdu — pas besoin d'une UI de
 * restauration dédiée. Nommé par `id` (stable, garanti unique par
 * `randomProjectId()`), pas par titre, pour ne jamais créer de collision ni
 * de fichier orphelin après un renommage.
 */
export async function writeStudioProjectFile(parent: LocalDirectoryHandle, id: string, document: object) {
  const studio = await parent.getDirectoryHandle('studio', { create: true });
  const file = await studio.getFileHandle(`${id}${STUDIO_PROJECT_EXT}`, { create: true });
  const writable = await file.createWritable();
  await writable.write(`${JSON.stringify(document, null, 2)}\n`);
  await writable.close();
}

/** Supprime le fichier miroir d'un projet Studio (id) s'il existe. Silencieux si déjà absent. */
export async function removeStudioProjectFile(parent: LocalDirectoryHandle, id: string) {
  try {
    const studio = await parent.getDirectoryHandle('studio');
    await studio.removeEntry(`${id}${STUDIO_PROJECT_EXT}`);
  } catch {
    // Déjà absent (dossier studio/ jamais créé, ou fichier déjà supprimé) : rien à faire.
  }
}

/** Ids des projets Studio déjà miroités dans `<dossier de travail>/studio/` — sert à repérer les fichiers à supprimer lors de la réconciliation (projet supprimé de la bibliothèque depuis une autre session). */
export async function listStudioProjectFileIds(parent: LocalDirectoryHandle): Promise<string[]> {
  try {
    const studio = await parent.getDirectoryHandle('studio');
    const ids: string[] = [];
    for await (const handle of studio.values()) {
      if (!isDirectory(handle) && handle.name.endsWith(STUDIO_PROJECT_EXT)) ids.push(handle.name.slice(0, -STUDIO_PROJECT_EXT.length));
    }
    return ids;
  } catch {
    return [];
  }
}
