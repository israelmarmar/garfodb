import { Gun } from '../gun/root.js';

declare var window: any;
declare var indexedDB: any;
declare var location: any;
declare var require: any;

function Store(opt?: any): any {
  opt = opt || {};
  opt.file = String(opt.file || 'radata');
  let store = (Store as any)[opt.file];
  let db: any = null;
  const u = undefined;

  if (store) {
    console.log("Warning: reusing same IndexedDB store and options as 1st.");
    return (Store as any)[opt.file];
  }
  store = (Store as any)[opt.file] = function () { };

  try { opt.indexedDB = opt.indexedDB || Store.indexedDB || indexedDB; } catch (e) { }
  try {
    if (!opt.indexedDB || 'file:' === location.protocol) {
      const s: any = store.d || (store.d = {});
      store.put = function (f: string, d: any, cb: any) { s[f] = d; setTimeout(function () { cb(null, 1); }, 250); };
      store.get = function (f: string, cb: any) { setTimeout(function () { cb(null, s[f] || u); }, 5); };
      console.log('Warning: No indexedDB exists to persist data to!');
      return store;
    }
  } catch (e) { }

  store.start = function () {
    const o = indexedDB.open(opt.file, 1);
    o.onupgradeneeded = function (eve: any) { (eve.target.result).createObjectStore(opt.file); };
    o.onsuccess = function () { db = o.result; };
    o.onerror = function (eve: any) { console.log(eve || 1); };
  };
  store.start();

  store.put = function (key: string, data: any, cb: any) {
    if (!db) { setTimeout(function () { store.put(key, data, cb); }, 1); return; }
    const tx = db.transaction([opt.file], 'readwrite');
    const obj = tx.objectStore(opt.file);
    const req = obj.put(data, '' + key);
    req.onsuccess = obj.onsuccess = tx.onsuccess = function () { cb(null, 1); };
    req.onabort = obj.onabort = tx.onabort = function (eve: any) { cb(eve || 'put.tx.abort'); };
    req.onerror = obj.onerror = tx.onerror = function (eve: any) { cb(eve || 'put.tx.error'); };
  };

  store.get = function (key: string, cb: any) {
    if (!db) { setTimeout(function () { store.get(key, cb); }, 9); return; }
    const tx = db.transaction([opt.file], 'readonly');
    const obj = tx.objectStore(opt.file);
    const req = obj.get('' + key);
    req.onsuccess = function () { cb(null, req.result); };
    req.onabort = function (eve: any) { cb(eve || 4); };
    req.onerror = function (eve: any) { cb(eve || 5); };
  };

  setInterval(function () { db && db.close(); db = null; store.start(); }, 1000 * 15);

  return store;
}

if (typeof window !== "undefined") {
  (Store.window = window).RindexedDB = Store;
  Store.indexedDB = window.indexedDB;
}

try {
  const Gun2 = Store.window ? Store.window.Gun : undefined;
  const gunRef = Gun2 || require('../gun');
  gunRef.on('create', function (this: any, root: any) {
    this.to.next(root);
    root.opt.store = root.opt.store || Store(root.opt);
  });
} catch (e) { }

export { Store };
export default Store;
