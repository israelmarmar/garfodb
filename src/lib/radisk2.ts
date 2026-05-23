import { Gun } from '../gun/root.js';
import { Radix as RadixFn } from './radix2.js';

declare var require: any;
declare var window: any;

type RadixFn = ReturnType<typeof RadixFn>;
const Radix: typeof RadixFn & { map: (radix: any, cb: any, opt?: any, pre?: string[]) => any } = RadixFn as any;

const u = undefined;

function ename(t: string): string {
  return encodeURIComponent(t).replace(/\*/g, '%2A');
}

function atomic(v: any): boolean {
  return u !== v && (!v || typeof v !== 'object');
}

function Radisk(opt?: any): any {
  opt = opt || {};
  opt.log = opt.log || console.log;
  opt.file = String(opt.file || 'radata');
  const has = ((Radisk as any).has || ((Radisk as any).has = {}))[opt.file];
  if (has) { return has; }

  opt.pack = opt.pack || (opt.memory ? (opt.memory * 1000 * 1000) : 1399000000) * 0.3;
  opt.until = opt.until || opt.wait || 250;
  opt.batch = opt.batch || (10 * 1000);
  opt.chunk = opt.chunk || (1024 * 1024 * 1);
  opt.code = opt.code || {};
  opt.code.from = opt.code.from || '!';

  const map = (Gun as any).obj.map;
  const LOG = false;

  if (!opt.store) {
    return opt.log("ERROR: Radisk needs `opt.store` interface with `{get: fn, put: fn (, list: fn)}`!");
  }
  if (!opt.store.put) {
    return opt.log("ERROR: Radisk needs `store.put` interface with `(file, data, cb)`!");
  }
  if (!opt.store.get) {
    return opt.log("ERROR: Radisk needs `store.get` interface with `(file, cb)`!");
  }

  const r: any = function (key: string, val?: any, cb?: any) {
    key = '' + key;
    if (val instanceof Function) {
      const o = cb || {};
      cb = val;
      val = r.batch(key);
      if (u !== val) {
        cb(u, r.range(val, o), o);
        if (atomic(val)) { return; }
      }
      if (r.thrash.at) {
        val = r.thrash.at(key);
        if (u !== val) {
          cb(u, r.range(val, o), o);
          if (atomic(val)) { cb(u, val, o); return; }
        }
      }
      return r.read(key, cb, o);
    }
    r.batch(key, val);
    if (cb) { r.batch.acks.push(cb); }
    if (++r.batch.ed >= opt.batch) { return r.thrash(); }
    if (r.batch.to) { return; }
    r.batch.to = setTimeout(r.thrash, opt.until || 1);
  };

  r.batch = Radix();
  r.batch.acks = [];
  r.batch.ed = 0;

  r.thrash = function () {
    const thrash = r.thrash;
    if (thrash.ing) { return thrash.more = true; }
    thrash.more = false;
    thrash.ing = true;
    const batch = thrash.at = r.batch;
    let i = 0;
    clearTimeout(r.batch.to);
    r.batch = null;
    r.batch = Radix();
    r.batch.acks = [];
    r.batch.ed = 0;
    r.save(batch, function (err: any, ok?: any) {
      if (++i > 1) {
        opt.log('RAD ERR: Radisk has callbacked multiple times, please report this as a BUG at github.com/amark/gun/issues ! ' + i);
        return;
      }
      if (err) { opt.log('err', err); }
      map(batch.acks, function (cb: any) { cb(err, ok); });
      thrash.at = null;
      thrash.ing = false;
      if (thrash.more) { thrash(); }
    });
  };

  r.save = function (rad: any, cb: any) {
    const s: any = function Span() { };
    s.find = function (tree: any, key: string) {
      if (key < s.start) { return; }
      s.start = key;
      r.list(s.lex);
      return true;
    };
    s.lex = function (file: string) {
      file = (u === file) ? u : decodeURIComponent(file);
      if (!file || file > s.start) {
        s.mix(s.file || opt.code.from, s.start, s.end = file);
        return true;
      }
      s.file = file;
    };
    s.mix = function (file: string, start: string, end?: string) {
      s.start = s.end = s.file = u;
      r.parse(file, function (err: any, disk?: any) {
        if (err) { return cb(err); }
        disk = disk || Radix();
        Radix.map(rad, function (val: any, key: string) {
          if (key < start) { return; }
          if (end && end < key) { return s.start = key; }
          disk(key, val);
        });
        r.write(file, disk, s.next);
      });
    };
    s.next = function (err: any, ok?: any) {
      if (s.err = err) { return cb(err); }
      if (s.start) { return Radix.map(rad, s.find); }
      cb(err, ok);
    };
    Radix.map(rad, s.find);
  };

  r.write = function (file: string, rad: any, cb: any, o?: any) {
    o = (typeof o === 'object') ? o : { force: o };
    const f: any = function Fractal() { };
    f.text = '';
    f.count = 0;
    f.file = file;
    f.each = function (val: any, key: string, k: string, pre: string[]) {
      if (u !== val) { f.count++; }
      if (opt.pack <= (val || '').length) { cb("Record too big!"); return true; }
      const enc = (Radisk as any).encode(pre.length) + '#' + (Radisk as any).encode(k) + (u === val ? '' : ':' + (Radisk as any).encode(val)) + '\n';
      if ((opt.chunk < f.text.length + enc.length) && (1 < f.count) && !o.force) {
        f.text = '';
        f.limit = Math.ceil(f.count / 2);
        f.count = 0;
        f.sub = Radix();
        Radix.map(rad, f.slice);
        return true;
      }
      f.text += enc;
    };
    f.write = function () {
      const tmp = ename(file);
      opt.store.put(tmp, f.text, function (err: any) {
        if (err) { return cb(err); }
        r.list.add(tmp, cb);
      });
    };
    f.slice = function (val: any, key: string) {
      if (key < f.file) { return; }
      if (f.limit < (++f.count)) {
        const name = f.file;
        f.file = key;
        f.count = 0;
        r.write(name, f.sub, f.next, o);
        return true;
      }
      f.sub(key, val);
    };
    f.next = function (err: any) {
      if (err) { return cb(err); }
      f.sub = Radix();
      if (!Radix.map(rad, f.slice)) {
        r.write(f.file, f.sub, cb, o);
      }
    };
    if (opt.jsonify) { return r.write.jsonify(f, file, rad, cb, o); }
    if (!Radix.map(rad, f.each, true)) { f.write(); }
  };

  r.write.jsonify = function (f: any, file: string, rad: any, cb: any, o: any) {
    let raw: string;
    try { raw = JSON.stringify(rad.$); } catch (e) { return cb("Record too big!"); }
    if (opt.chunk < raw.length && !o.force) {
      if (Radix.map(rad, f.each, true)) { return; }
    }
    f.text = raw;
    f.write();
  };

  r.range = function (tree: any, o?: any) {
    if (!tree || !o) { return; }
    if (u === o.start && u === o.end) { return tree; }
    if (atomic(tree)) { return tree; }
    const sub = Radix();
    Radix.map(tree, function (v: any, k: string) {
      sub(k, v);
    }, o);
    return sub('');
  };

  (function () {
    const Q: any = {};
    r.read = function (key: string, cb: any, o?: any) {
      o = o || {};
      if (RAD && !o.next) {
        const val = RAD(key);
        if (atomic(val)) { cb(u, val, o); return; }
      }
      o.span = (u !== o.start) || (u !== o.end);
      const g: any = function Get() { };
      g.lex = function (file: string) {
        let tmp: any;
        file = (u === file) ? u : decodeURIComponent(file);
        tmp = o.next || key || (o.reverse ? o.end || '\uffff' : o.start || '');
        if (!file || (o.reverse ? file < tmp : file > tmp)) {
          if (o.next || o.reverse) { g.file = file; }
          if (tmp = Q[g.file]) {
            tmp.push({ key: key, ack: cb, file: g.file, opt: o });
            return true;
          }
          Q[g.file] = [{ key: key, ack: cb, file: g.file, opt: o }];
          if (!g.file) {
            g.it(null, u, {});
            return true;
          }
          r.parse(g.file, g.it);
          return true;
        }
        g.file = file;
      };
      g.it = function (err: any, disk?: any, info?: any) {
        if (g.err = err) { opt.log('err', err); }
        g.info = info;
        if (disk) { RAD = g.disk = disk; }
        disk = Q[g.file]; delete Q[g.file];
        map(disk, g.ack);
      };
      g.ack = function (as: any) {
        if (!as.ack) { return; }
        const tmp = as.key;
        const o2 = as.opt;
        const info = g.info;
        const rad = g.disk || noop;
        const data = r.range(rad(tmp), o2);
        const last = rad.last;
        o2.parsed = (o2.parsed || 0) + (info.parsed || 0);
        o2.chunks = (o2.chunks || 0) + 1;
        if (!o2.some) { o2.some = (u !== data); }
        if (u !== data) { as.ack(g.err, data, o2); }
        else if (!as.file) { !o2.some && as.ack(g.err, u, o2); return; }
        if (!o2.span) {
          if (last === tmp) { !o2.some && as.ack(g.err, u, o2); return; }
          if (last && last > tmp && 0 !== last.indexOf(tmp)) { !o2.some && as.ack(g.err, u, o2); return; }
        }
        if (o2.some && o2.parsed >= o2.limit) { return; }
        o2.next = as.file;
        r.read(tmp, as.ack, o2);
      };
      if (o.reverse) { g.lex.reverse = true; }
      r.list(g.lex);
    };
  }());

  (function () {
    const Q: any = {};
    const s = String.fromCharCode(31);
    r.parse = function (file: string, cb: any, raw?: string) {
      let q: any;
      if (q = Q[file]) { return q.push(cb); }
      q = Q[file] = [cb];
      const p: any = function Parse() { };
      const info: any = {};
      p.disk = Radix();
      p.read = function (err: any, data?: any) {
        delete Q[file];
        if ((p.err = err) || (p.not = !data)) {
          return map(q, p.ack);
        }
        if (typeof data !== 'string') {
          try {
            if (opt.pack <= data.length) {
              p.err = "Chunk too big!";
            } else {
              data = data.toString();
            }
          } catch (e) { p.err = e; }
          if (p.err) { return map(q, p.ack); }
        }
        info.parsed = data.length;

        if (opt.jsonify) {
          try {
            const json = JSON.parse(data);
            p.disk.$ = json;
            map(q, p.ack);
            return;
          } catch (e) { }
          if ('{' === data[0]) {
            p.err = "JSON error!";
            return map(q, p.ack);
          }
        }
        let tmp = p.split(data);
        let pre: any = [];
        let i: any, k: any, v: any, at: any, ats: any = [];
        if (!tmp || 0 !== tmp[1]) {
          p.err = "File '" + file + "' does not have root radix! ";
          return map(q, p.ack);
        }
        while (tmp) {
          k = v = u;
          i = tmp[1];
          tmp = p.split(tmp[2]) || '';
          if ('#' === tmp[0]) {
            k = tmp[1];
            pre = pre.slice(0, i);
            if (i <= pre.length) {
              pre.push(k);
            }
          }
          tmp = p.split(tmp[2]) || '';
          if ('\n' === tmp[0]) {
            at = ats[i] || p.disk.at;
            p.disk(k, u, at);
            ats[i] = p.disk.at;
            ats[i + 1] = p.disk.at[k] || (p.disk.at[k] = {});
            continue;
          }
          if ('=' === tmp[0] || ':' === tmp[0]) { v = tmp[1]; }
          if (u !== k && u !== v) {
            at = ats[i];
            p.disk(k, v, at);
            ats[i] = p.disk.at;
            ats[i + 1] = p.disk.at[k];
          }
          tmp = p.split(tmp[2]);
        }
        map(q, p.ack);
      };
      p.split = function (t: string): any[] | undefined {
        if (!t) { return; }
        const o: any = {};
        let i = -1;
        i = t.indexOf(s);
        if (!t[i]) { return; }
        const a = t.slice(0, i);
        const l: any[] = [];
        l[0] = a;
        l[1] = (Radisk as any).decode(t.slice(i), o);
        l[2] = t.slice(i + o.i);
        return l;
      };
      p.ack = function (cb: any) {
        if (!cb) { return; }
        if (p.err || p.not) { return cb(p.err, u, info); }
        cb(u, p.disk, info);
      };
      if (raw) { return p.read(null, raw); }
      opt.store.get(ename(file), p.read);
    };
  }());

  (function () {
    let dir: any, q: any;
    const f = String.fromCharCode(28);
    const ef = ename(f);
    r.list = function (cb: any) {
      if (dir) {
        const tmp: any = { reverse: (cb.reverse) ? 1 : 0 };
        Radix.map(dir, function (val: any, key: string) {
          return cb(key);
        }, tmp) || cb();
        return;
      }
      if (q) { return q.push(cb); }
      q = [cb];
      r.parse(f, r.list.init);
    };
    r.list.add = function (file: string, cb: any) {
      const has = dir(file);
      if (has || file === ef) {
        return cb(u, 1);
      }
      dir(file, true);
      cb.listed = (cb.listed || 0) + 1;
      r.write(f, dir, function (err: any, ok?: any) {
        if (err) { return cb(err); }
        cb.listed = (cb.listed || 0) - 1;
        if (cb.listed !== 0) { return; }
        cb(u, 1);
      }, true);
    };
    r.list.init = function (err: any, disk?: any) {
      if (err) {
        opt.log('list', err);
        setTimeout(function () { r.parse(f, r.list.init); }, 1000);
        return;
      }
      if (disk) {
        r.list.drain(disk);
        return;
      }
      if (!opt.store.list) {
        r.list.drain(Radix());
        return;
      }
      opt.store.list(function (file: string) {
        dir = dir || Radix();
        if (!file) { return r.list.drain(dir); }
        r.list.add(file, noop);
      });
    };
    r.list.drain = function (rad: any) {
      r.list.dir = dir = rad;
      const tmp = q; q = null;
      (Gun as any).list.map(tmp, function (cb: any) {
        r.list(cb);
      });
    };
  }());

  const noop = function () { };
  let RAD: any;
  (Radisk as any).has[opt.file] = r;
  return r;
}

(function () {
  const _ = String.fromCharCode(31);
  (Radisk as any).encode = function (d: any, o?: any, s?: string) {
    s = s || _;
    let t = s;
    let tmp: any;
    if (typeof d === 'string') {
      let i = d.indexOf(s);
      while (i !== -1) { t += s; i = d.indexOf(s, i + 1); }
      return t + '"' + d + s;
    } else if (d && d['#'] && (tmp = (Gun as any).val.link.is(d))) {
      return t + '#' + tmp + t;
    } else if ((Gun as any).num.is(d)) {
      return t + '+' + (d || 0) + t;
    } else if (null === d) {
      return t + ' ' + t;
    } else if (true === d) {
      return t + '+' + t;
    } else if (false === d) {
      return t + '-' + t;
    }
  };

  (Radisk as any).decode = function (t: string, o?: any, s?: string) {
    s = s || _;
    if (s !== t[0]) { return; }
    let i = -1, n = 0, c: any, p: any;
    while (s === t[++i]) { ++n; }
    p = t[c = n] || true;
    while (--n >= 0) { i = t.indexOf(s, i + 1); }
    if (i === -1) { i = t.length; }
    const d = t.slice(c + 1, i);
    if (o) { o.i = i + 1; }
    if ('"' === p) {
      return d;
    } else if ('#' === p) {
      return (Gun as any).val.link.ify(d);
    } else if ('+' === p) {
      if (0 === d.length) { return true; }
      return parseFloat(d);
    } else if (' ' === p) {
      return null;
    } else if ('-' === p) {
      return false;
    }
  };
}());

(Radisk as any).Radix = Radix;

if (typeof window !== "undefined") {
  (window as any).Radisk = Radisk;
}

export { Radisk };
export default Radisk;
