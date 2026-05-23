import { Gun } from '../gun/root.js';

declare var require: any;
declare var window: any;

const _ = String.fromCharCode(24);
const u = undefined;
const no: any = {};

function Radix(): any {
  const radix: any = function (key: string, val?: any, t?: any) {
    key = '' + key;
    if (!t && u !== val) {
      radix.last = (key < radix.last) ? radix.last : key;
      delete (radix.$ || {})[_];
    }
    t = t || radix.$ || (radix.$ = {});
    if (!key && Object.keys(t).length) { return t; }
    let i = 0, l = key.length - 1, k = key[i], at: any, tmp: any;
    while (!(at = t[k]) && i < l) {
      k += key[++i];
    }
    radix.at = t;
    if (!at) {
      if (!(function mapEach(t: any, fn: (r: any, s: string) => any): any {
        for (const s in t) {
          if (!t.hasOwnProperty(s)) continue;
          const r2 = fn(t[s], s);
          if (r2 !== u) return r2;
        }
      }(t, function (r: any, s: string) {
        let ii: any = 0, kk = '';
        if ((s || '').length) {
          while (s[ii] === key[ii]) {
            kk += s[ii++];
          }
        }
        if (kk) {
          if (u === val) {
            if (ii <= l) { return; }
            return (tmp || (tmp = {}))[s.slice(ii)] = r;
          }
          const __: any = {};
          __[s.slice(ii)] = r;
          ii = key.slice(ii);
          ('' === ii) ? (__[''] = val) : ((__[ii] = {}) as any)[''] = val;
          t[kk] = __;
          delete t[s];
          return true;
        }
      }))) {
        if (u === val) { return; }
        (t[k] || (t[k] = {}))[''] = val;
      }
      if (u === val) {
        return tmp;
      }
    } else if (i === l) {
      if (u === val) { return (u === (tmp = at[''])) ? at : tmp; }
      at[''] = val;
    } else {
      if (u !== val) { delete at[_]; }
      return radix(key.slice(++i), val, at || (at = {}));
    }
  };
  return radix;
}

(Radix as any).map = function map(radix: any, cb: any, opt?: any, pre?: any): any {
  pre = pre || [];
  const t = (typeof radix === 'function') ? radix.$ || {} : radix;
  if (!t) { return; }
  let keys = ((t[_] || no) as any).sort || (t[_] = function $() { ($ as any).sort = Object.keys(t).sort(); return $; }() as any).sort;
  opt = (true === opt) ? { branch: true } : (opt || {});
  if (opt.reverse) { keys = keys.slice().reverse(); }
  const start = opt.start, end = opt.end;
  let i = 0, l = keys.length;
  for (; i < l; i++) {
    let key = keys[i], tree = t[key], tmp: any;
    if (!tree || '' === key || _ === key) { continue; }
    const p = pre.slice(); p.push(key);
    const pt = p.join('');
    if (u !== start && pt < (start || '').slice(0, pt.length)) { continue; }
    if (u !== end && (end || '\uffff') < pt) { continue; }
    if (u !== (tmp = tree[''])) {
      const tmp2 = cb(tmp, pt, key, pre);
      if (u !== tmp2) { return tmp2; }
    } else if (opt.branch) {
      const tmp2 = cb(u, pt, key, pre);
      if (u !== tmp2) { return tmp2; }
    }
    pre = p;
    const tmp3 = map(tree, cb, opt, pre);
    if (u !== tmp3) { return tmp3; }
    pre.pop();
  }
};

(Object as any).keys = (Object as any).keys || function (o: any) { return map(o, function (v: any, k: string, t: any) { t(k); }); };

const map: any = ((Gun as any).obj || {}).map;

if (typeof window !== "undefined") {
  (window as any).Radix = Radix;
}

export { Radix };
export default Radix;

export type RadixType = ReturnType<typeof Radix>;
