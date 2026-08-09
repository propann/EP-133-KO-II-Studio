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

export async function chooseLocalDirectory() {
  const picker = (window as Window & { showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<LocalDirectoryHandle> }).showDirectoryPicker;
  if (!picker) throw new Error('Ce navigateur ne permet pas l’accès direct aux dossiers. Utilisez Chrome ou Chromium en local.');
  return picker({ mode: 'readwrite' });
}

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

const safeName = (value: string) => value.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || 'mon-ep133';

export async function writeCloneManifest(parent: LocalDirectoryHandle, machineName: string, manifest: object) {
  const clone = await parent.getDirectoryHandle('clone', { create: true });
  const machine = await clone.getDirectoryHandle(safeName(machineName), { create: true });
  const file = await machine.getFileHandle('manifest.json', { create: true });
  const writable = await file.createWritable();
  await writable.write(`${JSON.stringify(manifest, null, 2)}\n`);
  await writable.close();
  return `${parent.name}/clone/${safeName(machineName)}/manifest.json`;
}
