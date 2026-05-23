import { Gun } from './root.js';
import { ChainContext } from '../types/chain.js';

const empty: any = {};
const u = undefined;

(Gun.chain as any).on = function on(this: Gun, cb: any, opt?: any): Gun {
  const gun = this;
  const at = gun._ as ChainContext;
  const root = at.root;

  if (typeof cb !== 'function') {
    if (cb === false) {
      if (opt) {
        const anyFn = (at.any as any || {})[opt];
        if (anyFn) anyFn.off();
        return gun;
      }
      if (at.any) {
        Object.keys(at.any).forEach((k: string) => (at.any as any)[k].off());
      }
      return gun;
    }
    return gun;
  }

  opt = opt || {};
  const anyFn: any = function anyFn(msg: any, eve?: any) {
    if (anyFn.stun) return;
    const data = (msg.put || '')['='];
    cb.call(
      (anyFn as any).as || gun,
      (u !== data) ? data : msg.put,
      at.get,
      msg,
      eve || anyFn
    );
  };

  anyFn.at = at;
  anyFn.get = at.get;
  const anyId = opt.id || (at.any && Object.keys(at.any).length) || 0;
  (at.any || (at.any = {} as any))[anyId] = anyFn;
  anyFn.off = function () { anyFn.stun = 1; delete (at.any as any)[anyId]; };
  anyFn.stun = 0;

  // Register chain in root.next so map() can forward put events
  if (at.soul) {
    (root.next || (root.next = {}))[at.soul] = gun._;
  }

  if (at.put !== u) {
    (Gun as any).after(0, () => {
      (Gun.on as any)['in']({
        put: { '#': at.soul, '.': at.get, '=': at.put, '>': -Infinity },
        $: at.$,
      });
    });
  }

  return gun;
};

(Gun.chain as any).once = function once(this: Gun, cb: any, opt?: any): any {
  const gun = this;
  const my: any = {};
  let off: any;

  function wrap(msg: any, eve: any) {
    if (my.seen) return;
    my.seen = 1;
    off?.();
    let tmp: any = (msg.put || '')['='];
    cb.call(
      (opt && opt.as) || gun,
      (u !== tmp) ? tmp : msg.put,
      msg,
      eve
    );
  }

  off = gun.on(wrap, opt);
  return gun;
};

(Gun.chain as any).off = function off(this: Gun, ...args: any[]): Gun {
  return this.on(false as any, args[0] as any);
};
