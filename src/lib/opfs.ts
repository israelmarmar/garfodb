const u = undefined;

interface Store {
  put(file: string, data: string, cb: (err: any, ok?: number) => void): void;
  get(file: string, cb: (err: any, data?: string) => void): void;
  list?(cb: (file: string) => void): void;
}

function ename(t: string): string {
  return encodeURIComponent(t).replace(/\*/g, '%2A');
}

function dname(t: string): string {
  return decodeURIComponent(t);
}

async function getOpfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const nav = navigator as any;
    if (nav.storage && nav.storage.getDirectory) {
      return await nav.storage.getDirectory();
    }
  } catch (_) { }
  return null;
}

export function createOPFSStore(opt?: any): Store {
  let rootDir: FileSystemDirectoryHandle | null = null;
  let ready = false;
  const queue: Array<() => void> = [];
  let initErr: any = null;

  getOpfsRoot().then((dir) => {
    rootDir = dir;
    ready = true;
    if (!dir) {
      initErr = new Error('OPFS not available in this browser');
    }
    queue.forEach((fn) => fn());
    queue.length = 0;
  });

  function waitInit(cb: () => void): void {
    if (ready) { cb(); return; }
    queue.push(cb);
  }

  const store: Store = {
    put(file: string, data: string, cb: (err: any, ok?: number) => void): void {
      waitInit(async () => {
        if (initErr || !rootDir) { cb(initErr || 'OPFS unavailable'); return; }
        try {
          const fh = await rootDir.getFileHandle(ename(file), { create: true });
          const writable = await fh.createWritable({ keepExistingData: false });
          await writable.write(data);
          await writable.close();
          cb(null, data.length);
        } catch (e: any) {
          cb(e);
        }
      });
    },

    get(file: string, cb: (err: any, data?: string) => void): void {
      waitInit(async () => {
        if (initErr || !rootDir) { cb(initErr || 'OPFS unavailable'); return; }
        try {
          const fh = await rootDir.getFileHandle(ename(file));
          const fileObj = await fh.getFile();
          if (fileObj.size === 0) { cb(null, u); return; }
          const text = await fileObj.text();
          cb(null, text);
        } catch (e: any) {
          if (e.name === 'NotFoundError') { cb(null, u); return; }
          cb(e);
        }
      });
    },
  };

  store.list = function (cb: (file: string) => void): void {
    waitInit(async () => {
      if (initErr || !rootDir) { return; }
      try {
        const entries = rootDir.values();
        for await (const entry of entries) {
          if (entry.kind === 'file') {
            cb(dname(entry.name));
          }
        }
        cb(u as any);
      } catch (_) {
        cb(u as any);
      }
    });
  };

  return store;
}

export function setupOPFSStore(): void {
  const { Gun } = require('../gun/root.js');
  Gun.on('create', function (this: any, root: any) {
    this.to.next(root);
    root.opt.store = root.opt.store || createOPFSStore(root.opt);
  });
}

export default createOPFSStore;
