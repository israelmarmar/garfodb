import { createState, getState, setState as stateify, createDup, createAsk } from '../core/index.js';
import { isValidValue } from '../core/valid.js';
import { randomString, isPlainObject, isEmptyObject, eachBatch } from '../core/shim.js';
import { onto, createOnto, OntoContext, OntoEvent } from '../core/onto.js';
import { ChainContext, GunOptions, ChainEvent } from '../types/chain.js';
import { GraphNode, PutMessage, GetMessage, AckMessage, PutEnvelope, MessageContext } from '../types/message.js';

const u = undefined;
const empty: any = {};
const ERR = "Error: Invalid graph!";
const MAX_DEFER = 2147483647;
let C = 0, CT: number = 0;
const sT = setTimeout as any;

function cut(s: any): string {
  return " '" + String(s).slice(0, 9) + "...' ";
}

const L = JSON.stringify;
let CF = function () {
  if (C > 999 && (C / -(CT - (CT = +new Date())) > 1)) {
    console.log("Warning: You're syncing 1K+ records a second, faster than DOM can update - consider limiting query.");
    CF = function () { C = 0; };
  }
};

/* ─── Gun Class ─── */

export class Gun {
  static version = 0.2020;
  static chain = Gun.prototype as any;
  static on = onto as any;
  static valid = isValidValue;
  static state = Object.assign(createState, { is: getState, ify: stateify });
  static dup = createDup as any;
  static ask = createAsk as any;
  static log: any;
  static window: any;

  _!: ChainContext;

  constructor(o?: any) {
    if (o instanceof Gun) {
      this._ = { $: this } as any;
      return;
    }
    if (!(this instanceof Gun)) {
      return new (Gun as any)(o) as any;
    }
    return Gun.create((this._ = { $: this, opt: o } as any));
  }

  static is($: any): boolean {
    return ($ instanceof Gun) || !!($ && $._ && ($ === $._.$));
  }

  /* ─── Gun.create ─── */

  static create(at: ChainContext): Gun {
    at.root = at.root || at;
    at.graph = at.graph || {};
    at.on = at.on || Gun.on;
    (at as any).ask = (at as any).ask || createAsk(Gun.on);
    at.dup = at.dup || createDup();
    const gun = at.$.opt(at.opt);
    if (!at.once) {
      at.on('in', universe, at);
      at.on('out', universe, at);
      at.on('put', map, at);
      Gun.on('create', at);
      at.on('create', at);
    }
    at.once = 1;
    return gun;
  }

  /* ─── Gun.chain.toJSON ─── */

  toJSON() { }
}

(Gun.chain as any).toJSON = function () { };

/* ─── Universe ─── */

export function universe(this: OntoEvent, msg: any): void {
  if (!msg) return;
  if (msg.out === universe) {
    this.to.next(msg);
    return;
  }

  const eve = this;
  const as = eve.as;
  const at = as.at || as;
  const gun = at.$;
  const dup = at.dup;

  let tmp = msg['#'];
  if (!tmp) msg['#'] = tmp = randomString(9);

  if (dup.check(tmp)) return;
  dup.track(tmp);

  tmp = msg._;
  msg._ = (typeof tmp === 'function') ? tmp : function () { };

  if (msg.$ && msg.$ === ((msg.$._ || '').$)) { /* ok */ }
  else { msg.$ = gun; }

  if (msg['@'] && !msg.put) { ack(msg); }

  if (!at.ask(msg['@'], msg)) {
    if (msg.put) { put(msg); return; }
    else if (msg.get) { Gun.on.get(msg, gun); }
  }

  eve.to.next(msg);

  if (msg.nts || msg.NTS) return;
  msg.out = universe;
  at.on('out', msg);
}

(Gun.on as any).universe = universe;

/* ─── Put Processing ─── */

let textRand = randomString;
let turn = sT.turn || ((fn: () => void) => setTimeout(fn, 0));
const stateIs = getState;
const stateIty = stateify;

function put(msg: any): void {
  if (!msg) return;
  const ctx: any = msg._ || '';
  const root = ctx.root = ((ctx.$ = msg.$ || '')._ || '').root;

  if (msg['@'] && ctx.faith && !ctx.miss) {
    msg.out = universe;
    root.on('out', msg);
    return;
  }

  ctx.latch = root.hatch;
  ctx.match = root.hatch = [];

  const putData = msg.put;
  const S = +new Date();
  CT = CT || S;

  if (putData['#'] && putData['.']) return;

  ctx['#'] = msg['#'];
  ctx.msg = msg;
  ctx.all = 0;
  ctx.stun = 1;

  const souls = Object.keys(putData);
  let ni = 0, nj: any, kl: string[] = [], soul: string = '', node: any, states: any, err: any;

  (function pop(o?: number) {
    if (nj !== ni) {
      nj = ni;
      soul = souls[ni];
      if (!soul) {
        fire(ctx);
        return;
      }
      node = putData[soul];
      if (!node) { err = ERR + cut(soul) + "no node."; }
      else {
        const tmp = node._;
        if (!tmp) { err = ERR + cut(soul) + "no meta."; }
        else if (soul !== tmp['#']) { err = ERR + cut(soul) + "soul not same."; }
        else if (!(states = tmp['>'])) { err = ERR + cut(soul) + "no state."; }
      }
      kl = Object.keys(node || {});
    }

    if (err) {
      msg.err = ctx.err = err;
      fire(ctx);
      return;
    }

    let i = 0, key: string;
    o = o || 0;
    while (o++ < 9 && (key = kl[i++])) {
      if (key === '_') continue;
      const val = node[key];
      const state = states[key];
      if (u === state) { err = ERR + cut(key) + "on" + cut(soul) + "no state."; break; }
      if (!isValidValue(val)) { err = ERR + cut(key) + "on" + cut(soul) + "bad " + (typeof val) + cut(val); break; }
      ham(val, key, soul, state, msg);
      ++C;
    }
    if ((kl = kl.slice(i)).length) { turn(pop); return; }
    ++ni;
    kl = null as any;
    pop(o);
  })();
}

(Gun.on as any).put = put;

/* ─── HAM (Hypothetical Amnesia Machine) ─── */

function ham(val: any, key: string, soul: string, state: number, msg: PutMessage): void {
  const ctx: any = msg._ || '';
  const root = ctx.root;
  const graph = root.graph;
  const vertex: GraphNode = graph[soul] || empty;

  const was = stateIs(vertex, key, 1);
  const known = (vertex as any)[key];

  const now = createState();
  let tmp: number;

  if (state > now) {
    setTimeout(
      () => ham(val, key, soul, state, msg),
      (tmp = state - now) > MAX_DEFER ? MAX_DEFER : tmp
    );
    return;
  }

  if (state < was) {
    if (true || !ctx.miss) return;
  }

  if (!ctx.faith) {
    if (state === was && (val === known || L(val) <= L(known))) {
      if (!ctx.miss) return;
    }
  }

  ctx.stun++;

  const aid = msg['#'] + (ctx.all++);
  const id = {
    toString: () => aid,
    _: ctx,
    toJSON: function () { return aid; }
  };
  root.dup.track(id)['#'] = msg['#'];

  root.on('put', {
    '#': id,
    '@': msg['@'],
    put: { '#': soul, '.': key, ':': val, '>': state },
    ok: msg.ok,
    _: ctx,
  });
}

/* ─── Map ─── */

function map(this: any, msg: any): void {
  const eve = this as OntoEvent;
  const root = eve.as;
  const graph = root.graph;
  const ctx = msg._;
  const putData = msg.put;
  const soul = putData['#'];
  const key = putData['.'];
  const val = putData[':'];
  const state = putData['>'];
  const id = msg['#'];

  let tmp: any;
  if ((tmp = ctx.msg) && (tmp = tmp.put) && (tmp = tmp[soul])) {
    stateIty(tmp, key, state, val, soul);
  }

  graph[soul] = stateIty(graph[soul], key, state, val, soul);

  if ((tmp = (root.next || '')[soul])) {
    tmp.on('in', msg);
  }

  fire(ctx);
  eve.to.next(msg);
}

/* ─── Fire ─── */

function fire(ctx: any, _msg?: any): void {
  if (ctx.stop) return;
  if (!ctx.err && 0 < --ctx.stun) return;
  ctx.stop = 1;

  const root = ctx.root;
  if (!root) return;

  const tmp = ctx.match;
  tmp.end = 1;
  if (tmp === root.hatch) {
    const latch = ctx.latch;
    if (!latch || latch.end) { delete root.hatch; }
    else { root.hatch = latch; }
  }

  if (ctx.hatch) ctx.hatch();

  eachBatch(ctx.match, (cb: any) => { if (cb) cb(); });

  const msg = ctx.msg;
  if (!msg || ctx.err || msg.err) return;
  msg.out = universe;
  ctx.root.on('out', msg);

  CF();
}

/* ─── Ack ─── */

function ack(msg: any): void {
  const id = msg['@'] || '';
  let ctx: any;
  let tmp: any;

  if (!(ctx = id._)) {
    const dup = ((msg.$ || '')._ || '').root?.dup;
    if (!dup?.check(id)) return;
    msg['@'] = dup.check(id)['#'] || msg['@'];
    return;
  }

  ctx.acks = (ctx.acks || 0) + 1;
  if ((ctx.err = msg.err)) {
    msg['@'] = ctx['#'];
    fire(ctx);
  }

  ctx.ok = msg.ok || ctx.ok;
  if (!ctx.stop && !ctx.crack) {
    if (ctx.match) {
      ctx.crack = true;
      ctx.match.push(() => back(ctx));
    }
  }
  back(ctx);
}

function back(ctx: any): void {
  if (!ctx || !ctx.root) return;
  if (ctx.stun || ctx.acks !== ctx.all) return;
  ctx.root.on('in', { '@': ctx['#'], err: ctx.err, ok: ctx.err ? u : ctx.ok || { '': 1 } });
}

/* ─── Gun.on.get ─── */

(Gun.on as any).get = function getHandler(msg: GetMessage, gun: Gun): void {
  const root = (gun as any)._ as ChainContext;
  const get = msg.get;
  const soul = get['#'];
  let node = root.graph[soul];
  const has = get['.'];
  const next = root.next || (root.next = {});
  const at = next[soul];

  const ctx: any = msg._ || {};

  if (!node) { root.on('get', msg); return; }

  if (has) {
    if (typeof has !== 'string' || u === node[has]) {
      if (!((at as any)?.next || {})[has]) {
        root.on('get', msg);
        return;
      }
    }
    node = stateIty({}, has, stateIs(node, has), node[has], soul);
  }

  if (node) { ackGet(msg, node); }
  root.on('get', msg);
};

function ackGet(msg: GetMessage, node: GraphNode): void {
  const S = +new Date();
  const ctx: any = msg._ || {};
  const to = msg['#'];
  let id = randomString(9);
  let keys = Object.keys(node || '').sort();
  const soul = ((node || '' as any)._ || '')['#'];
  let kl = keys.length;
  let j = 0;
  const root = (msg.$ as any)._?.root;
  const F = node === root?.graph?.[soul];

  if (node) {
    (function go() {
      let i = 0, k: string;
      const putPart: any = {};
      while (i < 9 && (k = keys[i++])) {
        stateIty(putPart, k, stateIs(node, k), (node as any)[k], soul);
      }
      const remaining = keys.slice(i);
      const tmp: any = {};
      tmp[soul] = putPart;
      const faith = F ? (() => { const f: any = () => {}; f.ram = f.faith = true; return f; })() : undefined;
      const hasMore = remaining.length;
      root.on('in', {
        '@': to,
        '#': id,
        put: tmp,
        '%': hasMore ? (id = randomString(9)) : u,
        $: root.$,
        _: faith,
      });
      if (!hasMore) return;
      keys = remaining;
      setTimeout(() => (go as any)(), 0);
    })();
  }

  if (!node) {
    root.on('in', { '@': msg['#'] } as any);
  }
}

(Gun.on as any).get.ack = ackGet;

/* ─── Gun.chain.opt ─── */

(Gun.chain as any).opt = function opt(this: Gun, opt?: any): Gun {
  opt = opt || {};
  const gun = this;
  const at = gun._ as any;
  let tmp = opt.peers || opt;

  if (!isPlainObject(opt)) opt = {};
  if (!isPlainObject(at.opt)) at.opt = opt;
  if (typeof tmp === 'string') tmp = [tmp];
  if (!isPlainObject(at.opt.peers)) at.opt.peers = {};

  if (Array.isArray(tmp)) {
    opt.peers = {};
    tmp.forEach((url: string) => {
      const p = { id: url, url };
      opt.peers[url] = at.opt.peers[url] = at.opt.peers[url] || p;
    });
  }

  function each(this: any, k: string) {
    const v = this[k];
    if ((this && this.hasOwnProperty(k)) || typeof v === 'string' || isEmptyObject(v)) {
      this[k] = v;
      return;
    }
    if (v && v.constructor !== Object && !Array.isArray(v)) return;
    Object.keys(v).forEach(each, v);
  }
  Object.keys(opt).forEach(each, opt);

  at.opt.from = opt;
  Gun.on('opt', at);
  at.opt.uuid = at.opt.uuid || function uuid(l?: number) {
    return Gun.state().toString(36).replace('.', '') + randomString(l || 12);
  };

  return gun;
};

/* ─── Static Logger ─── */

Gun.log = function (...args: any[]): string {
  if (!Gun.log.off) {
    console.log.apply(console, args);
  }
  return args.join(' ');
} as any;

(Gun.log as any).once = function (w: string, s: string, o?: any) {
  o = (Gun.log as any).once;
  o[w] = o[w] || 0;
  return o[w]++ || (Gun.log as any)(s);
};

/* ─── Window / Module setup ─── */

if (typeof window !== 'undefined') {
  (window as any).GUN = (window as any).Gun = Gun;
  (window as any).Garfo = Gun;
  (Gun as any).window = window;
}

try {
  (console as any).only = function (this: any, i: number, ...args: any[]) {
    const ci = (console as any).only;
    return ci.i && i === ci.i && ci.i++ && (console.log.apply(console, args as any), true) && (args.join(' ') || true);
  };
} catch (_) { }

export default Gun;

// ─── Interface merging for runtime prototype methods ───
export interface Gun {
  put(data: any, cb?: any, as?: any): Gun;
  get(key: any, cb?: any, as?: any): Gun;
  back(n?: any, opt?: any): any;
  chain(sub?: any): Gun;
  on(tag: any, arg?: any, eas?: any, as?: any): Gun;
  once(cb?: any, opt?: any): Gun;
  off(): Gun;
  set(item: any, cb?: any, opt?: any): Gun;
  map(cb?: any, opt?: any): any;
  toJSON(): void;
  opt(opt?: any): Gun;
}
