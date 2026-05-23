import { Gun } from './root.js';
import { ChainContext } from '../types/chain.js';

const empty: any = {};

(Gun.chain as any).back = function back(this: Gun, n?: any, opt?: any): any {
  let tmp: any;
  n = n || 1;

  if (n === -1 || n === Infinity) {
    return (this._ as any).root.$;
  }

  if (n === 1) {
    return ((this._ as any).back || this._).$;
  }

  const gun = this;
  const at = gun._ as ChainContext;

  if (typeof n === 'string') {
    n = n.split('.');
  }

  if (Array.isArray(n)) {
    let i = 0;
    const l = n.length;
    let cur: any = at;
    for (i; i < l; i++) {
      cur = (cur || empty)[n[i]];
    }
    if (undefined !== cur) {
      return opt ? gun : cur;
    }
    if ((tmp = at.back)) {
      return tmp.$.back(n, opt);
    }
    return;
  }

  if (typeof n === 'function') {
    let yes: any;
    let cur: any = { back: at };
    while ((cur = cur.back) && undefined === (yes = n(cur, opt))) { }
    return yes;
  }

  if (typeof n === 'number') {
    return ((at.back || at).$ as Gun).back(n - 1);
  }

  return this;
};
