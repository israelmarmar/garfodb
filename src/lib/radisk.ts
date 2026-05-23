import { createRadix, Radix, RadixTree } from './radix.js';

const u = undefined;
const _sep = String.fromCharCode(31);

export interface RadiskOpts {
  file?: string;
  log?: (...args: any[]) => void;
  store?: {
    put(file: string, data: string, cb: (err: any, ok?: number) => void): void;
    get(file: string, cb: (err: any, data?: string) => void): void;
    list?: (cb: (file: string) => void) => void;
  };
  max?: number;
  until?: number;
  batch?: number;
  chunk?: number;
  code?: { from?: string };
  jsonify?: boolean;
  memory?: number;
  wait?: number;
  compare?: (existing: any, incoming: any, key: string, file: string) => any;
  [key: string]: any;
}

export interface RadiskType {
  (key: string, data?: any, cb?: any, tag?: any, DBG?: any): void;
  save: (key: string, data: any, cb: any, tag?: any, DBG?: any) => void;
  read: (key: string, cb: any, o?: any, DBG?: any) => void;
  write: (file: string, rad: any, cb: any, o?: any, DBG?: any) => void;
  parse: (file: string, cb: any, raw?: string, DBG?: any) => void;
  find: { (key: string, cb: any): void; add: (file: string, cb: any) => void; bad: (file: string, cb?: any) => void };
  range: (tree: any, o?: any) => any;
  disk: Record<string, any>;
  one: Record<string, any>;
  tags: Record<string, any>;
  list?: RadixTree;
}

const noop = function () { };

function ename(t: string): string {
  return encodeURIComponent(t).replace(/\*/g, '%2A');
}

function atomic(v: any): boolean {
  return u !== v && (!v || typeof v !== 'object');
}

let RadiskHas: Record<string, RadiskType> = {};

export function createRadisk(opt: RadiskOpts): RadiskType {
  opt = opt || {};
  opt.log = opt.log || console.log;
  opt.file = String(opt.file || 'radata');

  const has = RadiskHas[opt.file];
  if (has) return has;

  opt.max = opt.max || (opt.memory ? (opt.memory * 999 * 999) : 300000000) * 0.3;
  opt.until = opt.until || opt.wait || 250;
  opt.batch = opt.batch || (10 * 1000);
  opt.chunk = opt.chunk || (1024 * 1024 * 1);
  opt.code = opt.code || {};
  opt.code.from = opt.code.from || '!';
  opt.jsonify = true;

  const puff: (fn: () => void, t?: number) => any =
    (setTimeout as any).turn || ((fn: () => void) => setTimeout(fn, 0));
  const map = Radix.object;
  const S = 0;

  if (!opt.store) {
    opt.log("ERROR: Radisk needs `opt.store` interface with `{get: fn, put: fn (, list: fn)}`!");
    return null as any;
  }

  const r: RadiskType = function (this: any, key: string, data?: any, cb?: any, tag?: any, DBG?: any): void {
    if (typeof data === 'function') {
      const o = cb || {};
      cb = data;
      r.read(key, cb, o, DBG || tag);
      return;
    }
    r.save(key, data, cb, tag, DBG);
  } as any;

  r.disk = {};
  r.one = {};
  r.tags = {};

  /* ─── save ─── */

  r.save = function (key, data, cb, tag, DBG) {
    const s: any = { key };
    s.find = function (file?: string) {
      s.file = file || (file = opt.code!.from!);
      const tmp = r.disk[file];
      if (tmp) { s.mix(u, tmp); return; }
      r.parse(file, s.mix, u, DBG);
    };
    s.mix = function (err: any, disk?: any) {
      if (s.err = err || s.err) { cb(err); return; }
      const file = s.file = (disk || '').file || s.file;
      if (!disk && file !== opt.code!.from) {
        r.find.bad(file);
        r.save(key, data, cb, tag);
        return;
      }
      const diskEntry = r.disk[file] || (r.disk[file] = disk || createRadix());
      diskEntry.file || (diskEntry.file = file);

      if (opt.compare) {
        data = opt.compare(diskEntry(key), data, key, file);
        if (u === data) { cb(err, -1); return; }
      }
      (s.disk = diskEntry)(key, data);

      if (tag) {
        let tmp: any;
        tmp = (tmp = diskEntry.tags || (diskEntry.tags = {}))[tag] || (tmp[tag] = r.tags[tag] || (r.tags[tag] = {}));
        tmp[file] || (tmp[file] = r.one[tag] || (r.one[tag] = cb));
        cb = null;
      }

      if (diskEntry.Q) {
        cb && diskEntry.Q.push(cb);
        return;
      }
      diskEntry.Q = cb ? [cb] : [];
      diskEntry.to = setTimeout(s.write, opt.until);
    };
    s.write = function () {
      const file = s.file;
      const diskEntry = s.disk;
      const q = s.q = diskEntry.Q;
      const tags = s.tags = diskEntry.tags;
      delete diskEntry.Q;
      delete r.disk[file];
      delete diskEntry.tags;
      r.write(file, diskEntry, s.ack, u, DBG);
    };
    s.ack = function (err: any, ok?: any) {
      let ack: any, tmp: any;
      for (const id in r.tags) {
        if (!r.tags.hasOwnProperty(id)) continue;
        const tag = r.tags[id];
        if ((tmp = r.disk[s.file]) && (tmp = tmp.tags) && tmp[tag]) continue;
        ack = tag[s.file];
        delete tag[s.file];
        let ne: boolean | undefined;
        for (const k in tag) {
          if (tag.hasOwnProperty(k)) { ne = true; break; }
        }
        if (ne) continue;
        delete r.tags[tag];
        ack && ack(err, ok);
      }
      const qList = s.q || [];
      for (let i = 0; i < qList.length; i++) {
        (ack = qList[i]) && ack(err, ok);
      }
    };
    cb || (cb = function (err: any) { if (!err) return; });
    r.find(key, s.find);
  };

  /* ─── write ─── */

  r.write = function (file, rad, cb, o, DBG) {
    if (!rad) { cb('No radix!'); return; }
    o = (typeof o === 'object') ? o : { force: o };
    const f: any = function Fractal() { };
    f.text = '';
    f.file = file = rad.file || (rad.file = file);
    if (!file) { cb('What file?'); return; }

    f.write = function () {
      const text = rad.raw = f.text;
      r.disk[file = rad.file || f.file || file] = rad;
      r.find.add(file, function add(err: any) {
        if (err) { cb(err); return; }
        opt.store!.put(ename(file), text, function safe(err2: any, ok?: number) {
          cb(err2, ok || 1);
          if (!rad.Q) { delete r.disk[file]; }
        });
      });
    };

    f.split = function () {
      f.text = '';
      if (!f.count) {
        f.count = 0;
        Radix.map(rad, function count() { f.count++; });
      }
      f.limit = Math.ceil(f.count / 2);
      f.count = 0;
      f.sub = createRadix();
      Radix.map(rad, f.slice, { reverse: 1 });
      r.write(f.end, f.sub, function (err: any, ok?: any) {
        if (err) { cb(err); return; }
        f.hub = createRadix();
        Radix.map(rad, f.stop);
        r.write(rad.file, f.hub, cb, o);
      }, o);
      return true;
    };

    f.slice = function (val: any, key: string) {
      f.sub(f.end = key, val);
      if (f.limit <= (++f.count)) return true;
    };

    f.stop = function (val: any, key: string) {
      if (key >= f.end) return true;
      f.hub(key, val);
    };

    f.each = function (val: any, key: string) {
      if (u !== val) f.count++;
      if (opt.max! <= (val || '').length) { cb("Data too big!"); return true; }
      const enc = Radisk.encode(preLen) + '#' + Radisk.encode(k) + (u === val ? '' : ':' + Radisk.encode(val)) + '\n';
      if ((opt.chunk! < f.text.length + enc.length) && (1 < f.count) && !o.force) {
        return f.split();
      }
      f.text += enc;
    };
    let preLen: any, k: any;
    f.each = function (val: any, key: string, kArg: string, pre: string[]) {
      if (u !== val) f.count++;
      preLen = pre ? pre.length : 0;
      k = kArg;
      if (opt.max! <= ((val || '').length)) { cb("Data too big!"); return true; }
      const enc = Radisk.encode(preLen) + '#' + Radisk.encode(k) + (u === val ? '' : ':' + Radisk.encode(val)) + '\n';
      if ((opt.chunk! < f.text.length + enc.length) && (1 < f.count) && !o.force) {
        return f.split();
      }
      f.text += enc;
    };

    if (opt.jsonify) {
      (r.write as any).jsonify(f, rad, cb, o, DBG);
      return;
    }
    if (!Radix.map(rad, f.each, true)) { f.write(); }
  };

  (r.write as any).jsonify = function (f: any, rad: any, cb: any, o: any, _DBG?: any) {
    let raw: string;
    try { raw = JSON.stringify(rad.$); } catch (e) { cb("Cannot radisk!"); return; }
    if (opt.chunk! < raw.length && !o.force) {
      let c = 0;
      Radix.map(rad, function () { if (c++) return true; });
      if (c > 1) { f.split(); return; }
    }
    f.text = raw;
    f.write();
  };

  /* ─── range ─── */

  r.range = function (tree, o) {
    if (!tree || !o) return;
    if (u === o.start && u === o.end) return tree;
    if (atomic(tree)) return tree;
    const sub = createRadix();
    Radix.map(tree, function (v: any, k: string) { sub(k, v); }, o);
    return sub('');
  };

  /* ─── read ─── */

  r.read = function (key, cb, o, DBG) {
    o = o || {};
    const g: any = { key };
    g.find = function (file?: string) {
      g.file = file || (file = opt.code!.from!);
      const tmp = r.disk[g.file = file];
      if (tmp) { g.check(u, tmp); return; }
      r.parse(file, g.check, u, DBG);
    };
    g.get = function (err: any, disk?: any, info?: any) {
      if (g.err = err || g.err) { cb(err); return; }
      const file = g.file = (disk || '').file || g.file;
      if (!disk && file !== opt.code!.from) {
        r.find.bad(file);
        r.read(key, cb, o);
        return;
      }
      disk = r.disk[file] || (r.disk[file] = disk);
      if (!disk) { cb(file === opt.code!.from ? u : "No file!"); return; }
      disk.file || (disk.file = file);
      let data = r.range(disk(key), o);
      o.unit = disk.unit;
      o.chunks = (o.chunks || 0) + 1;
      o.parsed = (o.parsed || 0) + ((info || '').parsed || (o.chunks * opt.chunk!));
      o.more = 1;
      o.next = u;

      if (r.list) {
        Radix.map(r.list, function next(v: any, f: string) {
          if (!v || file === f) return;
          o.next = f;
          return 1;
        }, o.reverse ? { reverse: 1, end: file } : { start: file });
      }

      if (!o.next) { o.more = 0; }
      if (o.next) {
        if (!o.reverse && ((key < o.next && o.next.indexOf(key) !== 0) ||
          (u !== o.end && (o.end || '\uffff') < o.next))) {
          o.more = 0;
        }
        if (o.reverse && ((key > o.next && key.indexOf(o.next) !== 0) ||
          ((u !== o.start && (o.start || '') > o.next && file <= o.start)))) {
          o.more = 0;
        }
      }
      if (!o.more) { cb(g.err, data, o); return; }
      if (data) { cb(g.err, data, o); }
      if (o.parsed >= o.limit) return;
      const next = o.next;
      setTimeout(function () {
        r.parse(next, g.check);
      }, 0);
    };
    g.check = function (err: any, disk?: any, info?: any) {
      g.get(err, disk, info);
      if (!disk || disk.check) return;
      disk.check = 1;
      info = info || {};
      info.file = g.file;
      Radix.map(disk, function (val: any, key: string) {
        r.find(key, function (file: string) {
          if ((file || (file = opt.code!.from!)) === info.file) return;
          puff(function () {
            r.save(key, val, function ack(err2: any) {
              if (err2) { r.save(key, val, ack); return; }
            });
          }, 0);
        });
      });
    };
    r.find(key || (o.reverse ? (o.end || '') : (o.start || '')), g.find);
  };

  /* ─── parse ─── */

  {
    const Q: Record<string, any[]> = {};
    const s = String.fromCharCode(31);
    r.parse = function (file, cb, raw, DBG) {
      if (!file) { cb(); return; }
      const q = Q[file];
      if (q) { q.push(cb); return; }
      Q[file] = [cb];
      const p: any = function Parse() { };
      const info: any = { file };
      p.disk = createRadix();
      p.disk.file = file;

      p.read = function (err: any, rawData?: string) {
        let data: string = rawData!;
        if (err || !data) {
          p.err = err || 1;
          delete Q[file];
          p.map(q, p.ack);
          return;
        }
        if (typeof data !== 'string') {
          try {
            if (opt.max! <= (data as any).length) { p.err = "Chunk too big!"; }
            else { data = (data as any).toString(); }
          } catch (e) { p.err = e; }
          if (p.err) {
            delete Q[file];
            p.map(q, p.ack);
            return;
          }
        }
        info.parsed = data.length;
        if (opt.jsonify || data[0] === '{') {
          try {
            const tree = JSON.parse(data);
            delete Q[file];
            p.disk.$ = tree;
            p.map(q, p.ack);
            return;
          } catch (e) {
            if (data[0] === '{') {
              delete Q[file];
              p.err = e as string || "JSON error!";
              p.map(q, p.ack);
              return;
            }
          }
        }
        delete Q[file];
        p.radec(err, data);
      };

      const qList: any[] = q;
      p.map = function () {
        if (!qList || !qList.length) return;
        const err = p.err;
        const data = p.not ? u : p.disk;
        let i = 0;
        let ack: any;
        while (i < 9 && (ack = qList[i++])) { ack(err, data, info); }
        const remaining = qList.slice(i);
        if (!remaining.length) return;
        puff(p.map, 0);
      };

      p.ack = function (cb: any) {
        if (!cb) return;
        if (p.err || p.not) { cb(p.err, u, info); return; }
        cb(u, p.disk, info);
      };

      p.radec = function (_err: any, data: string) {
        delete Q[file];
        const tmp = p.split(data);
        const pre: string[] = [];
        let i: number, k: string, v: any;
        let tok: any = tmp;

        if (!tok || tok[1] !== 0) {
          p.err = "File '" + file + "' does not have root radix! ";
          p.map(q, p.ack);
          return;
        }
        while (tok) {
          k = v = u as any as string;
          i = tok[1];
          tok = p.split(tok[2]) || '';
          if (tok[0] === '#') {
            k = tok[1];
            pre.length = i;
            if (i <= pre.length) { pre.push(k); }
          }
          tok = p.split(tok[2]) || '';
          if (tok[0] === '\n') continue;
          if (tok[0] === '=' || tok[0] === ':') { v = tok[1]; }
          if (u !== k && u !== v) { p.disk(pre.join(''), v); }
          tok = p.split(tok[2]);
        }
        p.map(q, p.ack);
      };

      p.split = function (t: string): any[] | undefined {
        if (!t) return;
        const i = t.indexOf(s);
        if (i < 0) return;
        const a = t.slice(0, i);
        const o: any = {};
        const b = Radisk.decode(t.slice(i), o);
        return [a, b, t.slice(i + o.i)];
      };

      if (r.disk) { raw = raw || (r.disk[file] || '').raw; }
      if (raw) {
        setTimeout(function () { p.read(u, raw); }, 0);
        return;
      }
      opt.store!.get(ename(file), p.read);
    };
  }

  /* ─── find ─── */

  {
    let dir: RadixTree | undefined;
    const f = String.fromCharCode(28);
    let initQ: [string, any][] | undefined;

    (r as any).find = function (key: string, cb: any) {
      if (!dir) {
        if (initQ) { initQ.push([key, cb]); return; }
        initQ = [[key, cb]];
        r.parse(f, init);
        return;
      }
      if (r.list) {
        Radix.map(r.list, function (_val, fileKey) {
          return cb(fileKey) || true;
        }, { reverse: 1, end: key }) || cb(opt.code!.from);
      }
    };

    (r as any).find.add = function (file: string, cb: any) {
      const has = dir!(file);
      if (has || file === f) { cb(u, 1); return; }
      dir!(file, 1);
      cb.found = (cb.found || 0) + 1;
      r.write(f, dir!, function (err: any) {
        if (err) { cb(err); return; }
        cb.found = (cb.found || 0) - 1;
        if (cb.found !== 0) return;
        cb(u, 1);
      }, true);
    };

    (r as any).find.bad = function (file: string, cb?: any) {
      dir!(file, 0);
      r.write(f, dir!, cb || noop);
    };

    function init(err: any, disk?: any) {
      if (err) {
        opt.log!('list', err);
        setTimeout(function () { r.parse(f, init); }, 1000);
        return;
      }
      if (disk) { drain(disk); return; }
      dir = dir || disk || createRadix();
      if (!opt.store!.list) { drain(dir!); return; }
      opt.store!.list(function (file: string) {
        if (!file) { drain(dir!); return; }
        r.find.add(file, noop);
      });
    }

    function drain(rad: RadixTree) {
      dir = dir || rad;
      (dir as any).file = f;
      const tmp = initQ;
      initQ = undefined;
      if (tmp) {
        for (let i = 0; i < tmp.length; i++) {
          r.find(tmp[i][0], tmp[i][1]);
        }
      }
    }
  }

  RadiskHas[opt.file] = r;
  return r;
}

/* ─── Encode / Decode ─── */

export namespace Radisk {
  export function encode(d: any, o?: any, s?: string): string {
    s = s || _sep;
    let t = s;
    if (typeof d === 'string') {
      let i = d.indexOf(s);
      while (i !== -1) { t += s; i = d.indexOf(s, i + 1); }
      return t + '"' + d + s;
    }
    if (d && d['#'] && Object.keys(d).length === 1) {
      return t + '#' + (o || '') + t;
    }
    if (typeof d === 'number') {
      return t + '+' + (d || 0) + t;
    }
    if (d === null) {
      return t + ' ' + t;
    }
    if (d === true) {
      return t + '+' + t;
    }
    if (d === false) {
      return t + '-' + t;
    }
    return '';
  }

  export function decode(t: string, o?: any, s?: string): any {
    s = s || _sep;
    if (s !== t[0]) return;
    let i = -1, n = 0;
    while (s === t[++i]) { ++n; }
    const c = n;
    const p = t[c] || true;
    while (--n >= 0) { i = t.indexOf(s, i + 1); }
    if (i === -1) { i = t.length; }
    const d = t.slice(c + 1, i);
    if (o) { o.i = i + 1; }
    if (p === '"') return d;
    if (p === '#') return { '#': d };
    if (p === '+') {
      if (d.length === 0) return true;
      return parseFloat(d);
    }
    if (p === ' ') return null;
    if (p === '-') return false;
  }
}

export default createRadisk;
