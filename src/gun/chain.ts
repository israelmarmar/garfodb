import { Gun } from './root.js';
import { ChainContext, ChainEvent } from '../types/chain.js';
import { isValidValue } from '../core/valid.js';
import { randomString } from '../core/shim.js';
import { getState, setState } from '../core/state.js';

const empty: any = {};
const u = undefined;
const textRand = randomString;
const valid = isValidValue;
const objHas = (o: any, k: string) => o && Object.prototype.hasOwnProperty.call(o, k);
const stateIs = getState;
const stateIty = setState;

/* ─── Gun.chain.chain ─── */

(Gun.chain as any).chain = function chain(this: Gun, sub?: any): Gun {
  const at = this._ as ChainContext;
  const chain = new (sub || this).constructor(this);
  const cat = chain._ as ChainContext;
  const root = at.root;

  cat.root = root;
  cat.id = ++root.once;
  cat.back = at;
  cat.on = Gun.on;

  cat.on('in', Gun.on.in, cat);
  cat.on('out', Gun.on.out, cat);

  return chain;
};

/* ─── Output ─── */

function output(this: any, msg: any): void {
  let tmp: any;
  const at = this.as as ChainContext;
  const back = at.back as ChainContext;
  const root = at.root;

  if (!msg.$) msg.$ = at.$;
  this.to.next(msg);

  if (at.err) {
    at.on('in', { put: (at as any).put = u, $: at.$ } as any);
    return;
  }

  const get = msg.get;
  if (get) {
    if (root.pass) { root.pass[at.id] = at; }

    if (at.lex) {
      tmp = msg.get = msg.get || {};
      Object.keys(at.lex).forEach((k) => {
        tmp[k] = at.lex[k];
      });
    }

    if (get['#'] || at.soul) {
      get['#'] = get['#'] || at.soul;
      msg['#'] = msg['#'] || textRand(9);
      const backAt = root.$.get(get['#'])._;
      const getDot = get['.'];

      if (!getDot) {
        tmp = backAt.ask && backAt.ask[''];
        (backAt.ask || (backAt.ask = {}))[''] = backAt;
        if (u !== backAt.put) {
          backAt.on('in', backAt as any);
          if (tmp) return;
        }
        msg.$ = backAt.$;
      } else if (objHas(backAt.put, getDot)) {
        tmp = backAt.ask && backAt.ask[getDot];
        (backAt.ask || (backAt.ask = {}))[getDot] = backAt.$.get(getDot)._;
        backAt.on('in', {
          get: getDot,
          put: { '#': backAt.soul!, '.': getDot, ':': (backAt.put as any)[getDot], '>': stateIs(root.graph[backAt.soul!], getDot) },
        } as any);
        if (tmp) return;
      }

      root.ask(ack, msg);
      return root.on('in', msg);
    }

    if (get['.']) {
      if (at.get) {
        msg = { get: { '.': at.get }, $: at.$ };
        (back.ask || (back.ask = {}))[at.get] = msg.$._;
        return back.on('out', msg);
      }
      msg = { get: at.lex ? msg.get : {}, $: at.$ };
      return back.on('out', msg);
    }

    (at.ask || (at.ask = {}))[''] = at;
    if (at.get) {
      get['.'] = at.get;
      (back.ask || (back.ask = {}))[at.get] = msg.$._;
      return back.on('out', msg);
    }
  }

  return back?.on('out', msg);
}

(Gun.on as any).out = output;

/* ─── Input ─── */

function input(this: any, msg: ChainEvent, catArg?: ChainContext): void {
  const cat = catArg || this.as;
  const root = cat.root;
  const gun = msg.$ || (msg.$ = cat.$);
  const at = (gun?._ || empty) as ChainContext;
  const putEnv = msg.put || '';
  let soul: string = putEnv['#'];
  let key: string = putEnv['.'];
  const change = (u !== putEnv['=']) ? putEnv['='] : putEnv[':'];
  let state = putEnv['>'] || -Infinity;

  let tmp: any;
  if (u !== msg.put && (u === putEnv['#'] || u === putEnv['.'] || (u === putEnv[':'] && u === putEnv['=']) || u === putEnv['>'])) {
    if (!valid(putEnv)) {
      soul = putEnv._?.['#'];
      if (!soul) { console.log("chain not yet supported for", putEnv, '...', msg, cat); return; }
      const g = cat.root.$.get(soul);
      const keys = Object.keys(putEnv).sort();
      for (let ki = 0; ki < keys.length; ki++) {
        const k = keys[ki];
        if (k === '_' || u === (state = stateIs(putEnv, k))) continue;
        cat.on('in', { $: g, put: { '#': soul, '.': k, '=': putEnv[k], '>': state }, VIA: msg } as any);
      }
      return;
    }
    cat.on('in', {
      $: (at.back || cat.back as any)?.$,
      put: { '#': soul = (cat.back as any)?.soul, '.': key = cat.has || cat.get, '=': putEnv, '>': stateIs((cat.back as any)?.put, key) },
      via: msg,
    } as any);
    return;
  }

  if (msg.seen?.[cat.id]) return;
  if (!msg.seen) msg.seen = () => {};
  (msg.seen as any)[cat.id] = cat;

  if (cat !== at) {
    const copy: any = {};
    Object.keys(msg).forEach((k) => { copy[k] = (msg as any)[k]; });
    copy.get = cat.get || copy.get;
    if (!cat.soul && !cat.has) {
      copy.$$$ = copy.$$$ || cat.$;
    } else if (at.soul) {
      copy.$ = cat.$;
      copy.$$ = copy.$$ || at.$;
    }
    msg = copy;
  }

  unlink(msg as any, cat);

  if ((cat.soul || msg.$$) && state >= stateIs(root.graph[soul], key)) {
    tmp = root.$.get(soul)._.put;
    stateIty(tmp, key, state, change, soul);
  }

  if (!at.soul && state >= stateIs(root.graph[soul], key)) {
    const sat = (root.$.get(soul)._.next || {})[key];
    if (sat) {
      sat.put = change;
      if (typeof (tmp = valid(change)) === 'string') {
        sat.put = root.$.get(tmp)._.put || change;
      }
    }
  }

  this.to?.next(msg);

  if (cat.any) {
    const anyKeys = Object.keys(cat.any);
    for (let ai = 0; ai < anyKeys.length; ai++) {
      const anyFn = cat.any[anyKeys[ai]];
      if (anyFn) anyFn(msg);
    }
  }

  if (cat.echo) {
    const echoKeys = Object.keys(cat.echo);
    for (let ei = 0; ei < echoKeys.length; ei++) {
      const lat = cat.echo[echoKeys[ei]];
      if (lat) lat.on('in', msg);
    }
  }

  if ((msg.$$?._ || at).soul) {
    const sat = cat.next?.[key!];
    if (sat) {
      const copy: any = {};
      Object.keys(msg).forEach((k) => { copy[k] = (msg as any)[k]; });
      copy.$ = (msg.$$ || msg.$).get(copy.get = key);
      delete copy.$$;
      delete copy.$$$;
      sat.on('in', copy);
    }
  }

  link(msg as any, cat);
}

(Gun.on as any).in = input;

/* ─── Link ─── */

function link(this: any, msg: ChainEvent, catArg?: ChainContext): void {
  const cat = catArg || this.as || msg.$?._;
  if (msg.$$ && this !== Gun.on) return;
  if (!msg.put || cat.soul) return;

  const putEnv = msg.put || '';
  let linkVal = putEnv['='] || putEnv[':'];
  const root = cat.root;
  const tat = root.$.get(putEnv['#']).get(putEnv['.'])._;

  if (typeof (linkVal = valid(linkVal)) !== 'string') {
    if (this === Gun.on) { (tat.echo || (tat.echo = {}))[cat.id] = cat; }
    return;
  }

  if ((tat.echo || (tat.echo = {}))[cat.id] && !(root.pass || {})[cat.id]) return;

  const pass = root.pass;
  if (pass) {
    if (pass[linkVal + cat.id]) return;
    pass[linkVal + cat.id] = 1;
  }

  (tat.echo || (tat.echo = {}))[cat.id] = cat;

  if (cat.has) { cat.link = linkVal; }

  const sat = root.$.get(tat.link = linkVal)._;
  (sat.echo || (sat.echo = {}))[tat.id] = tat;

  const asks: any = cat.ask || '';
  if (asks[''] || cat.lex) {
    sat.on('out', { get: { '#': linkVal } });
  }

  const askKeys = Object.keys(asks);
  for (let ai = 0; ai < askKeys.length; ai++) {
    const getKey = askKeys[ai];
    if (!getKey || !asks[getKey]) continue;
    sat.on('out', { get: { '#': linkVal, '.': getKey } });
  }
}

(Gun.on as any).link = link;

/* ─── Unlink ─── */

function unlink(msg: ChainEvent, cat: ChainContext): void {
  const putEnv = msg.put || '';
  const change = (u !== putEnv['=']) ? putEnv['='] : putEnv[':'];
  const root = cat.root;
  let tmp: any;

  if (u === change) {
    if (cat.soul && u !== cat.put) return;

    tmp = (msg.$$ || msg.$ || '')._ || '';
    if (msg['@'] && (u !== tmp.put || u !== cat.put)) return;

    const linkRef = cat.link || (msg as any).linked;
    if (linkRef) {
      delete (root.$.get(linkRef)._?.echo || {})[cat.id];
    }

    if (cat.has) { cat.link = null as any; }
    cat.put = u;

    if (cat.next) {
      const nextKeys = Object.keys(cat.next);
      for (let ni = 0; ni < nextKeys.length; ni++) {
        const getKey = nextKeys[ni];
        const sat = cat.next[getKey];
        if (!sat) return;
        if (linkRef) {
          delete (root.$.get(linkRef).get(getKey)._?.echo || {})[sat.id];
        }
        sat.on('in', { get: getKey, put: u, $: sat.$ } as any);
      }
    }
    return;
  }

  if (cat.soul) return;
  if (msg.$$) return;

  const linkValid = valid(change);
  tmp = msg.$?._ || '';

  if (linkValid === tmp.link || (cat.has && !tmp.link)) {
    if ((root.pass || {})[cat.id] && typeof linkValid !== 'string') { /* pass through */ }
    else { return; }
  }

  delete (tmp.echo || {})[cat.id];
  unlink({ get: cat.get, put: u, $: msg.$, linked: (msg as any).linked || tmp.link } as any, cat);
}

(Gun.on as any).unlink = unlink;

/* ─── Ack ─── */

function ack(this: any, msg: any, _ev?: any): void {
  const as = this.as;
  const at = as.$._;
  const root = at.root;
  const get = as.get || '';
  const tmp = (msg.put || '')[get['#']] || '';

  if (!msg.put || (typeof get['.'] === 'string' && u === tmp[get['.']])) {
    if (u !== at.put) return;
    if (!at.soul && !at.has) return;

    at.ack = (at.ack || 0) + 1;
    at.on('in', {
      get: at.get,
      put: at.put = u,
      $: at.$,
      '@': msg['@'],
    } as any);
    return;
  }

  (msg._ || {} as any).miss = 1;
  (Gun.on as any).put(msg);
}
