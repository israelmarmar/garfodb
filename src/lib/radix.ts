const u = undefined;
const _ = String.fromCharCode(24);

function each(o: any, f: (v: any, k: string) => any): any {
  for (const k in o) {
    if (!o.hasOwnProperty(k)) continue;
    const r = f(o[k], k);
    if (r !== u) return r;
  }
}

const no: any = {};

export interface RadixTree {
  (key: string, val?: any, t?: any): any;
  $?: any;
  last?: string;
  unit?: number;
}

export function createRadix(): RadixTree {
  const radix: RadixTree = function (key: string, val?: any, t?: any): any {
    radix.unit = 0;
    if (!t && u !== val) {
      radix.last = ('' + key < (radix.last || '')) ? (radix.last || '') : '' + key;
      delete (radix.$ || {})[_];
    }
    t = t || radix.$ || (radix.$ = {});
    if (!key && Object.keys(t).length) return t;
    key = '' + key;
    let i = 0, l = key.length - 1, k = key[i], at: any, tmp: any;

    while (!(at = t[k]) && i < l) {
      k += key[++i];
    }

    if (!at) {
      if (!each(t, function (r: any, s: string) {
        let ii = 0, kk = '';
        if ((s || '').length) {
          while (s[ii] === key[ii]) { kk += s[ii++]; }
        }
        if (kk) {
          if (u === val) {
            if (ii <= l) return;
            (tmp || (tmp = {}))[s.slice(ii)] = r;
            return r;
          }
          const __: any = {};
          __[s.slice(ii)] = r;
          const kk2 = key.slice(ii);
          if ('' === kk2) { __[''] = val; } else { const sub: any = {}; sub[''] = val; __[kk2] = sub; }
          t[kk] = __;
          delete t[s];
          return true;
        }
      })) {
        if (u === val) return;
        (t[k] || (t[k] = {}))[''] = val;
      }
      if (u === val) return tmp;
    } else if (i === l) {
      if (u === val) return (u === (tmp = at[''])) ? at : ((radix.unit = 1) && tmp);
      at[''] = val;
    } else {
      if (u !== val) delete at[_];
      return radix(key.slice(++i), val, at || {});
    }
  } as RadixTree;

  return radix;
}

function sortKeys(t: any): string[] {
  return Object.keys(t).sort();
}

function getSorted(t: any): string[] {
  return (t[_] || no).sort || (t[_] = function $(): any { ($ as any).sort = sortKeys(t); return $; }() as any).sort;
}

export namespace Radix {
  export function map(
    radix: any,
    cb: (val: any, path: string, key: string, pre: string[]) => any,
    opt?: any,
    pre?: string[]
  ): any {
    try {
      pre = pre || [];
      const t = (typeof radix === 'function') ? radix.$ || {} : radix;
      if (!t) return;
      if (typeof t === 'string') {
        return;
      }

      let keys = getSorted(t);
      opt = (true === opt) ? { branch: true } : (opt || {});
      const rev = opt.reverse;
      if (rev) keys = keys.slice(0).reverse();
      const start = opt.start;
      const end = opt.end;
      const END = '\uffff';

      let i = 0;
      const l = keys.length;
      for (; i < l; i++) {
        const key = keys[i];
        const tree = t[key];
        let tmp: any;
        if (!tree || '' === key || _ === key || 'undefined' === key) continue;
        const pre2 = pre as string[];
        const p = pre2.slice(0);
        p.push(key);
        const pt = p.join('');
        if (u !== start && pt < (start || '').slice(0, pt.length)) continue;
        if (u !== end && (end || END) < pt) continue;

        if (rev) {
          tmp = Radix.map(tree, cb, opt, p);
          if (u !== tmp) return tmp;
        }

        if (u !== (tmp = tree[''])) {
          let yes = 1;
          if (u !== start && pt < (start || '')) yes = 0;
          if (u !== end && pt > (end || END)) yes = 0;
          if (yes) {
            tmp = cb(tmp, pt, key, pre2);
            if (u !== tmp) return tmp;
          }
        } else if (opt.branch) {
          tmp = cb(u, pt, key, pre2);
          if (u !== tmp) return tmp;
        }

        pre = p;
        if (!rev) {
          tmp = Radix.map(tree, cb, opt, pre);
          if (u !== tmp) return tmp;
        }
        (pre as string[]).pop();
      }
    } catch (e) { console.error(e); }
  }

  export function object(o: any, f: (v: any, k: string) => any): any {
    return each(o, f);
  }
}

export default createRadix;
