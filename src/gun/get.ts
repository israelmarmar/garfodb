import { Gun } from './root.js';
import { ChainContext } from '../types/chain.js';
import { isValidValue } from '../core/valid.js';
import { randomString } from '../core/shim.js';

const u = undefined;
const empty: any = {};
const valid = isValidValue;

(Gun.chain as any).get = function get(this: Gun, key: any, cb?: any, as?: any): Gun {
  let gun: Gun | undefined;
  let tmp: any;

  if (typeof key === 'string') {
    if (key.length === 0) {
      gun = this.chain();
      (gun as any)._.err = { err: Gun.log('0 length key!', key) };
      if (cb) { cb.call(gun, (gun as any)._.err); }
      return gun;
    }
    const back = this;
    const cat = back._ as ChainContext;
    const next = cat.next || empty;

    if (!(gun = next[key])) {
      const ctx = cache(key, back);
      gun = (ctx as any).$;
    }
    gun = (gun as any).$ || gun;
  } else if (typeof key === 'function') {
    if (cb === true) { soulCB(this, key); return this; }

    gun = this;
    const cat = (gun as any)._ as any;
    const opt = cb || {};
    const root = cat.root;
    let id: string;

    opt.at = cat;
    opt.ok = key;
    let wait: any = {};

    const anyFn: any = function any(msg: any, eve?: any, f?: number) {
      if (anyFn.stun) return;
      if ((tmp = root.pass) && !tmp[id]) return;

      const at = msg.$?._;
      const sat = (msg.$$ || '')._;
      let data = (sat || at)?.put;
      const odd = (!at?.has && !at?.soul);
      let test: any = {};

      if (odd || u === data) {
        data = (u === ((tmp = msg.put) || '')['='])
          ? (u === (tmp || '')[':'] ? tmp : tmp[':'])
          : tmp['='];
      }

      let link: any;
      if ((link = typeof (tmp = valid(data)) === 'string' ? tmp : undefined)) {
        data = (u === (tmp = root.$.get(link)._.put)) ? (opt.not ? u : data) : tmp;
      }

      if (opt.not && u === data) return;

      if (u === opt.stun) {
        if ((tmp = root.stun) && tmp.on) {
          cat.$.back((a: any) => {
            tmp.on('' + a.id, test = {});
            if ((test.run || 0) < anyFn.id) return test;
          });
          !test.run && tmp.on('' + at.id, test = {});
          !test.run && sat && tmp.on('' + sat.id, test = {});
          if (anyFn.id > test.run) {
            if (!test.stun || test.stun.end) {
              test.stun = tmp.on('stun');
              test.stun = test.stun && test.stun.last;
            }
            if (test.stun && !test.stun.end) {
              (test.stun.add || (test.stun.add = {}))[id] = () => anyFn(msg, eve, 1);
              return;
            }
          }
        }
        if (odd && u === data) { f = 0; }
        if ((tmp = root.hatch) && !tmp.end && u === opt.hatch && !f) {
          if (wait[at.$._.id]) return;
          wait = {};
          wait[at.$._.id] = 1;
          tmp.push(() => anyFn(msg, eve, 1));
          return;
        }
        wait = {};
      }

      if (root.pass) {
        if (root.pass[id + at.id]) return;
        root.pass[id + at.id] = 1;
      }

      if (opt.on) {
        opt.ok.call(at.$, data, at.get, msg, eve || anyFn);
        return;
      }
      if (opt.v2020) {
        opt.ok(msg, eve || anyFn);
        return;
      }
      const copy: any = {};
      Object.keys(msg).forEach((k: string) => { copy[k] = msg[k]; });
      msg = copy;
      msg.put = data;
      opt.ok.call(opt.as, msg, eve || anyFn);
    };

    anyFn.at = cat;
    (cat.any || (cat.any = {}))[id = randomString(7)] = anyFn;
    anyFn.stun = 0;
    anyFn.off = function () { anyFn.stun = 1; if (!cat.any) return; delete cat.any[id]; };
    anyFn.rid = rid;
    anyFn.id = opt.run || ++root.once;

    tmp = root.pass;
    (root.pass = {} as any)[id] = 1;
    opt.out = opt.out || { get: {} };
    cat.on('out', opt.out);
    root.pass = tmp;

    return gun;
  } else if (typeof key === 'number') {
    return this.get('' + key, cb, as);
  } else if (typeof (tmp = valid(key)) === 'string') {
    return this.get(tmp, cb, as);
  } else if ((tmp = (this.get as any).next)) {
    gun = tmp(this, key);
  }

  if (!gun) {
    gun = this.chain();
    (gun as any)._.err = { err: Gun.log('Invalid get request!', key) };
    if (cb) cb.call(gun, (gun as any)._.err);
    return gun;
  }

  if (cb && typeof cb === 'function') {
    gun.get(cb, as);
  }
  return gun;
};

function cache(key: string, back: Gun): ChainContext {
  const cat = back._ as ChainContext;
  const gun = back.chain();
  const at = gun._ as ChainContext;

  if (!cat.next) { (cat as any).next = {}; }
  (cat as any).next[at.get = key] = at;

  if ((back as any) === (cat.root as any).$) {
    at.soul = key;
  } else if (cat.soul || cat.has) {
    at.has = key;
  }

  return at;
}

function soulCB(gun: Gun, cb: any, opt?: any, as?: any): void {
  const cat = (gun as any)._ as any;
  let acks = 0;
  let tmp: any;

  if (tmp = cat.soul || cat.link) { cb(tmp, as, cat); return; }
  if (cat.jam) { cat.jam.push([cb, as]); return; }
  cat.jam = [[cb, as]];

  gun.get(function go(msg: any, eve?: any) {
    if (u === msg.put && !cat.root.opt.super &&
      (tmp = Object.keys(cat.root.opt.peers).length) && ++acks <= tmp) {
      return;
    }
    eve?.rid(msg);
    const at = ((msg.$) && msg.$._) || {};
    let i = 0;
    const jam = cat.jam;
    delete cat.jam;
    while (i < jam.length) {
      const entry = jam[i++];
      const fn = entry[0];
      const args = entry[1];
      const soulId = at.link || at.soul || valid(msg.put) || ((msg.put || {})._ || {})['#'];
      fn && fn(soulId, args, msg, eve);
    }
  }, { out: { get: { '.': true } } });
}

function rid(this: any, at: any): boolean | undefined {
  const cat = this.at || this.on;
  if (!at || cat.soul || cat.has) { this.off(); return; }
  const id = (at = (at.$ || at)._ || at).id;
  if (!id) return;
  const seen = this.seen || (this.seen = {});
  if (seen[id]) return true;
  seen[id] = true;
  return;
}
