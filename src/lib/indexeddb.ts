const u = undefined;

interface IDBStore {
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

function openDB(name: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = function () {
      const db = req.result;
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name);
      }
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

export function createIndexedDBStore(opt?: any): IDBStore {
  opt = opt || {};
  const storeName = String(opt.file || 'gun-radata');
  let dbPromise: Promise<IDBDatabase> | null = null;
  const u = undefined;

  function getDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
      dbPromise = openDB(storeName, 1);
    }
    return dbPromise;
  }

  const store: IDBStore = {
    put(file: string, data: string, cb: (err: any, ok?: number) => void): void {
      getDb().then((db) => {
        const tx = db.transaction(storeName, 'readwrite');
        const obj = tx.objectStore(storeName);
        const req = obj.put(data, ename(file));
        req.onsuccess = function () { cb(null, 1); };
        req.onerror = function () { cb(req.error); };
      }).catch((e) => cb(e));
    },

    get(file: string, cb: (err: any, data?: string) => void): void {
      getDb().then((db) => {
        const tx = db.transaction(storeName, 'readonly');
        const obj = tx.objectStore(storeName);
        const req = obj.get(ename(file));
        req.onsuccess = function () {
          cb(null, req.result || u);
        };
        req.onerror = function () { cb(req.error); };
      }).catch((e) => cb(e));
    },
  };

  store.list = function (cb: (file: string) => void): void {
    getDb().then((db) => {
      const tx = db.transaction(storeName, 'readonly');
      const obj = tx.objectStore(storeName);
      const req = obj.openCursor();
      req.onsuccess = function () {
        const cursor = req.result;
        if (cursor) {
          cb(dname(String(cursor.key)));
          cursor.continue();
        } else {
          cb(u as any);
        }
      };
      req.onerror = function () { cb(u as any); };
    }).catch(() => cb(u as any));
  };

  return store;
}

export function setupIndexedDBStore(): void {
  const { Gun } = require('../gun/root.js');
  Gun.on('create', function (this: any, root: any) {
    this.to.next(root);
    root.opt.store = root.opt.store || createIndexedDBStore(root.opt);
  });
}

export default createIndexedDBStore;
