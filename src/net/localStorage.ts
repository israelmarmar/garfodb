import { Gun } from '../gun/root.js';
import { isPlainObject } from '../core/shim.js';

const noop = function () { };
const u = undefined;
type JsonCb = (err: any, result?: string) => void;

const parse: (text: string, cb: JsonCb) => void = (JSON as any).parseAsync ||
  function (t: string, cb: JsonCb) {
    try { cb(undefined, JSON.parse(t)); } catch (e) { cb(e); }
  };
const json: (v: any, cb: JsonCb) => void = (JSON as any).stringifyAsync ||
  function (v: any, cb: JsonCb) {
    try { cb(undefined, JSON.stringify(v)); } catch (e) { cb(e); }
  };

interface DiskStore {
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
  getItem(k: string): string | null;
  [key: string]: any;
}

export function setupLocalStoragePersistence(): void {
  let store: DiskStore;
  try {
    store = ((Gun as any).window || noop).localStorage;
  } catch (e) {
    store = null as any;
  }

  if (!store) {
    Gun.log("Warning: No localStorage exists to persist data to!");
    store = {
      setItem: function (k: string, v: string) { this[k] = v; },
      removeItem: function (k: string) { delete this[k]; },
      getItem: function (k: string) { return this[k] || null; },
    };
  }

  const lg: any = function () { };

  Gun.on('create', function (this: any, root: any) {
    this.to.next(root);
    const opt = root.opt;
    const graph = root.graph;
    let acks: any[] = [];
    let disk: any;
    let to: any;
    let size: number;
    let stop: any;

    if (opt.localStorage === false) return;
    opt.prefix = opt.file || 'gun/';

    try {
      const stored = store.getItem(opt.prefix);
      disk = lg[opt.prefix] = lg[opt.prefix] || (stored ? JSON.parse(stored) : {});
      size = (stored || '').length;
    } catch (e) {
      disk = lg[opt.prefix] = {};
      size = 0;
    }

    root.on('get', function (this: any, msg: any) {
      this.to.next(msg);
      const lex = msg.get;
      let soul: string;
      let data: any;
      let tmp: any;

      if (!lex || !(soul = lex['#'])) return;
      data = disk[soul] || u;

      if (data && (tmp = lex['.']) && !isPlainObject(tmp)) {
        data = Gun.state.ify({}, tmp, Gun.state.is(data, tmp), data[tmp], soul);
      }

      Gun.on.get.ack(msg, data);
    });

    root.on('put', function (this: any, msg: any) {
      this.to.next(msg);
      const put = msg.put;
      const soul = put['#'];
      const key = put['.'];
      const id = msg['#'];
      const ok = msg.ok || '';
      let tmp: any;

      disk[soul] = Gun.state.ify(disk[soul], key, put['>'], put[':'], soul);

      if (stop && size > 4999880) {
        root.on('in', { '@': id, err: "localStorage max!" });
        return;
      }

      if (!msg['@'] && (!msg._.via || Math.random() < ((ok['@'] || 0) / (ok['/'] || 1)))) {
        acks.push(id);
      }

      if (to) return;
      to = setTimeout(flush, 9 + (size / 333));
    });

    function flush(): void {
      if (!acks.length && ((setTimeout as any).turn || {}).s && ((setTimeout as any).turn || {}).s.length) {
        setTimeout(flush, 99);
        return;
      }
      const err: any = false;
      const ackBatch = acks;
      clearTimeout(to);
      to = false;
      acks = [];

      json(disk, function (jsonErr: any, tmp?: string) {
        try {
          if (!jsonErr && tmp) store.setItem(opt.prefix, tmp);
        } catch (e) {
          stop = e || "localStorage failure";
        }

        if (stop) {
          Gun.log(stop + " Consider using GUN's IndexedDB plugin for RAD for more storage space, https://gun.eco/docs/RAD#install");
          root.on('localStorage:error', { err: stop, get: opt.prefix, put: disk });
        }

        if (tmp) size = tmp.length;

        if ((setTimeout as any).each) {
          (setTimeout as any).each(ackBatch, function (id: string) {
            root.on('in', { '@': id, err: jsonErr, ok: 0 });
          }, 0, 99);
        } else {
          ackBatch.forEach(function (id: string) {
            root.on('in', { '@': id, err: jsonErr, ok: 0 });
          });
        }
      });
    }
  });
}

export default setupLocalStoragePersistence;
