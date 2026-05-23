import { Gun } from '../gun/root.js';

export function createLocalStorageStore(opt?: any): any {
  opt = opt || {};
  opt.file = String(opt.file || 'radata');
  const ls = typeof localStorage !== 'undefined' ? localStorage : null;

  if (!ls) {
    return {
      put(_key: string, _data: any, cb: (err: any, ok?: number) => void): void { cb(null, 1); },
      get(_key: string, cb: (err: any, data?: any) => void): void { cb(null, undefined); },
    };
  }

  return {
    put(key: string, data: any, cb: (err: any, ok?: number) => void): void {
      ls[key] = data;
      cb(null, 1);
    },
    get(key: string, cb: (err: any, data?: any) => void): void {
      cb(null, ls[key]);
    },
  };
}

export function setupLocalStorageStore(): void {
  Gun.on('create', function (this: any, root: any) {
    this.to.next(root);
    root.opt.store = root.opt.store || createLocalStorageStore(root.opt);
  });
}

export default createLocalStorageStore;
