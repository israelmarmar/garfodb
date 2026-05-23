import { Gun } from './root.js';
import { ChainContext } from '../types/chain.js';
import { isPlainObject } from '../core/shim.js';
import { stringMatch } from '../core/shim.js';

const u = undefined;
const noop = () => {};
const event = { stun: noop, off: noop };

/* ─── get.next extension ─── */

let _nextGet: ((gun: Gun, lex: any) => any) | undefined;

(Gun.chain.get as any).next = function nextGet(this: Gun, key: any): Gun | undefined {
  if (!_nextGet) return undefined;
  return _nextGet(this, key);
};

/* ─── Gun.chain.get.next hook ─── */

(Gun.chain as any).get.next = function (gun: Gun, lex: any): any {
  if (!isPlainObject(lex)) {
    return (_nextGet || noop)(gun, lex);
  }

  const tmp = ((lex['#'] || '')['=']) || lex['#'];
  if (tmp) return gun.get(tmp);

  const chain = gun.chain();
  chain._.lex = lex;

  gun.on('in', function (this: any, eve: any) {
    if (stringMatch(eve.get || (eve.put || '')['.'], lex['.'] || lex['#'] || lex)) {
      (chain as any)._.on('in', eve);
    }
    this.to.next(eve);
  });

  return chain;
};

/* ─── Gun.chain.map ─── */

(Gun.chain as any).map = function map(this: Gun, cb?: any, opt?: any): any {
  const gun = this;
  const cat = gun._ as any;
  let lex: any;
  let chain: any;

  if (isPlainObject(cb)) {
    lex = cb['.'] ? cb : { '.': cb };
    cb = u;
  }

  if (!cb) {
    if (chain = cat.each) return chain;
    (cat.each = chain = gun.chain())._.lex = lex || chain._.lex || cat.lex;
    chain._.nix = gun.back('nix');
    gun.on('in', mapHandler, chain._);
    return chain;
  }

  Gun.log.once("mapfn", "Map functions are experimental, their behavior and API may change moving forward. Please play with it and report bugs and ideas on how to improve it.");
  chain = gun.chain();
  gun.map().on(function (this: any, data: any, key: string, msg: any, eve: any) {
    const next = (cb || noop).call(this, data, key, msg, eve);
    if (u === next) return;
    if (data === next) return chain._.on('in', msg);
    if ((Gun as any).is(next)) return chain._.on('in', next._);
    const copy: any = {};
    Object.keys(msg.put).forEach((k) => { copy[k] = msg.put[k]; });
    copy['='] = next;
    chain._.on('in', { get: key, put: copy });
  });
  return chain;
};

function mapHandler(this: any, msg: any): void {
  this.to.next(msg);
  const cat = this.as;
  const gun = msg.$;
  const at = gun._;
  const put = msg.put;
  let tmp: any;

  if (!at.soul && !msg.$$) return;
  if ((tmp = cat.lex) && !stringMatch(msg.get || (put || '')['.'], tmp['.'] || tmp['#'] || tmp)) return;
  (Gun.on as any).link(msg, cat);
}
