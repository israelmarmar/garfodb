import { Peer } from '../types/peer.js';
import { GunMessage, DamMessage, MessageContext } from '../types/message.js';
import { randomString, isPlainObject } from '../core/shim.js';

const noop = function () { };

interface MeshOpts {
  log?: (...args: any[]) => void;
  gap?: number;
  max?: number;
  pack?: number;
  puff?: number;
  peers?: Record<string, any>;
  lack?: number;
  super?: boolean;
  pid?: string;
  [key: string]: any;
}

interface MeshHearHandlers {
  [key: string]: (msg: any, peer: Peer, root: any) => void;
}

type JsonCb = (err: any, result?: string, sucks?: number) => void;
const parse: (text: string, cb: JsonCb) => void = (JSON as any).parseAsync ||
  function (t: string, cb: JsonCb, r?: any) {
    const d = +new Date;
    try { cb(undefined, JSON.parse(t, r)); } catch (e) { cb(e); }
  };
const json: any = (JSON as any).stringifyAsync ||
  function (v: any, cb: JsonCb, r?: any, s?: any) {
    const d = +new Date;
    try { cb(undefined, JSON.stringify(v, r, s)); } catch (e) { cb(e); }
  };
json.sucks = function (d: number) {
  if (d > 99) {
    console.log("Warning: JSON blocking CPU detected. Add `gun/lib/yson.js` to fix.");
    json.sucks = noop;
  }
};

function sortObj(k: string, v: any): any {
  let tmp: any;
  if (!(v instanceof Object)) return v;
  const result: any = {};
  Object.keys(v).sort().forEach((key) => { result[key] = v[key]; });
  return result;
}

function flush(peer: any): void {
  let batch = peer.batch;
  const t = typeof batch === 'string';
  if (t) peer.batch += ']';
  peer.batch = peer.tail = null;
  if (!batch) return;
  if (t ? 3 > batch.length : !batch.length) return;
  if (!t) {
    try {
      batch = (1 === batch.length ? batch[0] : JSON.stringify(batch));
    } catch (e) {
      const pOpt = peer._opt || {};
      (pOpt.log || console.log)('DAM JSON stringify error', e);
      return;
    }
  }
  if (!batch) return;
  send(batch, peer);
}

function send(raw: string, peer: any): void {
  try {
    const wire = peer.wire;
    if (peer.say) {
      peer.say(raw);
    } else if (wire && wire.send) {
      wire.send(raw);
    }
    peer._sayD = (peer._sayD || 0) + (raw.length || 0);
    peer._sayC = (peer._sayC || 0) + 1;
  } catch (e) {
    (peer.queue = peer.queue || []).push(raw);
  }
}

export function createMesh(root: any): any {
  const mesh: any = function () { };
  const opt: MeshOpts = root.opt || {};
  opt.log = opt.log || console.log;
  opt.gap = opt.gap || opt.wait || 0;
  opt.max = opt.max || (opt.memory ? (opt.memory * 999 * 999) : 300000000) * 0.3;
  opt.pack = opt.pack || (opt.max * 0.01 * 0.01);
  opt.puff = opt.puff || 9;

  const puff: (fn: () => void, t?: number) => any =
    (setTimeout as any).turn || setTimeout;

  const dup = root.dup;
  const dupCheck = dup.check;
  const dupTrack = dup.track;

  let ST = +new Date;
  let LT = ST;

  /* ─── hear ─── */

  const hear: any = mesh.hear = function (this: any, raw: any, peer: Peer) {
    if (!raw) return;
    if (opt.max != null && opt.max <= raw.length) {
      mesh.say({ dam: '!', err: "Message too big!" }, peer);
      return;
    }
    if (mesh === this) {
      hear.d += (raw.length || 0);
      hear.c++;
    }
    const S = peer.SH = +new Date;
    const tmp = raw[0];
    let msg: any;

    if ('[' === tmp) {
      parse(raw, function (err, msgs) {
        if (err || !msgs) {
          mesh.say({ dam: '!', err: "DAM JSON parse error." }, peer);
          return;
        }
        const P = opt.puff || 9;
        (function go() {
          let i = 0;
          let m: any;
          while (i < P && (m = msgs[i++])) {
            mesh.hear(m, peer);
          }
          msgs = msgs.slice(i);
          flush(peer);
          if (!msgs.length) return;
          puff(go, 0);
        })();
      });
      raw = '';
      return;
    }

    if ('{' === tmp || ((raw['#'] || isPlainObject(raw)) && (msg = raw))) {
      if (msg) { hear.one(msg, peer, S); return; }
      parse(raw, function (err, result) {
        if (err || !result) {
          mesh.say({ dam: '!', err: "DAM JSON parse error." }, peer);
          return;
        }
        hear.one(result, peer, S);
      });
      return;
    }
  } as any;

  hear.c = 0;
  hear.d = 0;

  /* ─── hear.one ─── */

  hear.one = function (msg: any, peer: Peer, _S?: number): void {
    let id: string;
    let hash: any;
    let tmp: any;
    let ash: any;

    if (msg.DBG) { /* debug marker */ }

    if (!(id = msg['#'])) {
      id = msg['#'] = randomString(9);
    }

    if ((tmp = dupCheck(id))) return;

    if (!(hash = msg['##']) && false && undefined !== msg.put) {
      // hashing disabled for now
    }

    if (hash && (tmp = msg['@'] || (msg.get && id)) && dupCheck(ash = tmp + hash)) {
      return;
    }

    (msg._ = function () { } as any).via = mesh.leap = peer;

    if ((tmp = msg['><']) && typeof tmp === 'string') {
      tmp.slice(0, 99).split(',').forEach(function (k: string) {
        (msg._).yo = (msg._).yo || {};
        (msg._).yo[k] = 1;
      });
    }

    if (tmp = msg.dam) {
      const handler = mesh.hear[tmp];
      if (handler) handler(msg, peer, root);
      dupTrack(id);
      return;
    }

    if (tmp = msg.ok) {
      msg._.near = tmp['/'];
    }

    dupTrack.ed = function (d: string) {
      if (id !== d) return;
      dupTrack.ed = 0;
      const tracked = dup.s && dup.s[id];
      if (!tracked) return;
      tracked.via = peer;
      if (msg.get) tracked.it = msg;
    };

    root.on('in', mesh.last = msg);
    dupTrack(id);

    if (ash) dupTrack(ash);

    mesh.leap = mesh.last = null;
  };

  /* ─── hash ─── */

  mesh.hash = function (msg: any, peer: Peer): void {
    let h: any, s: string, t: string;
    json(msg.put, function hashCallback(err: any, text?: string) {
      const ss = (s || (s = t = text || '')).slice(0, 32768);
      h = (String as any).hash(ss, h);
      s = s.slice(32768);
      if (s) { puff(hashCallback as any, 0); return; }
      msg._.$put = t;
      msg['##'] = h;
      mesh.say(msg, peer);
      delete msg._.$put;
    }, sortObj);
  };

  /* ─── say ─── */

  const say = mesh.say = function (this: any, msg: any, peer?: Peer): boolean | undefined {
    let tmp: any;
    if ((tmp = this) && (tmp = tmp.to) && tmp.next) {
      tmp.next(msg);
    }
    if (!msg) return false;

    let id: string;
    let hash: any;
    let raw: string | undefined;
    const ack = msg['@'];
    const meta: any = msg._ || (msg._ = function () { });
    const S = +new Date;
    meta.y = meta.y || S;

    if (!peer) {
      // debug timestamp
    }

    if (!(id = msg['#'])) {
      id = msg['#'] = randomString(9);
    }

    !loop && dupTrack(id);

    if (!(hash = msg['##']) && undefined !== msg.put && !meta.via && ack) {
      mesh.hash(msg, peer);
      return;
    }

    if (!peer && ack) {
      peer = ((tmp = dup.s[ack]) && (tmp.via || ((tmp = tmp.it) && (tmp = tmp._) && tmp.via))) ||
        ((tmp = mesh.last) && ack === tmp['#'] && mesh.leap);
    }

    if (!peer && ack) {
      if (dup.s[ack]) return;
      return false;
    }

    if (ack && !msg.put && !hash && ((dup.s[ack] || '').it || '')['##']) {
      return false;
    }

    if (!peer && mesh.way) return mesh.way(msg);

    if (!(raw = meta.raw)) {
      mesh.raw(msg, peer);
      return;
    }

    if (!peer || !peer.id) {
      if (!isPlainObject(peer || opt.peers)) return false;
      const ps = opt.peers || {};
      let pl = Object.keys(peer || opt.peers || {});
      (function go() {
        loop = 1;
        const wr = meta.raw;
        meta.raw = raw;
        let i = 0;
        let p: any;
        while (i < 9 && (p = (pl || '')[i++])) {
          const target = ps[p] || (peer || {})[p];
          if (target) mesh.say(msg, target);
        }
        meta.raw = wr;
        loop = 0;
        pl = pl.slice(i);
        if (!pl.length) return;
        puff(go, 0);
        ack && dupTrack(ack);
      })();
      return;
    }

    if (!peer.wire && mesh.wire) mesh.wire(peer);

    if (id === peer.last) return;
    peer.last = id;

    if (peer === meta.via) return false;

    if ((tmp = meta.yo) && (tmp[peer.url || ''] || tmp[peer.pid || ''] || tmp[peer.id || ''])) {
      return false;
    }

    !loop && ack && dupTrack(ack);

    if (peer.batch) {
      peer.tail = (tmp = peer.tail || 0) + (raw.length || 0);
      if (peer.tail <= (opt.pack || 0)) {
        peer.batch += (tmp ? ',' : '') + raw;
        return;
      }
      flush(peer);
    }

    peer.batch = '[';
    setTimeout(function () {
      flush(peer);
    }, opt.gap || 0);

    send(raw, peer);

    return true;
  } as any;

  let loop = 0;
  let SMIA = 0;
  say.c = 0;
  say.d = 0;

  /* ─── raw ─── */

  mesh.raw = function (msg: any, peer?: Peer): any {
    if (!msg) return '';
    const meta: any = msg._ || {};
    let tmp: any;

    if (tmp = meta.raw) return tmp;
    if (typeof msg === 'string') return msg;

    const hash = msg['##'];
    const ack = msg['@'];

    if (hash && ack) {
      if (!meta.via && dupCheck(ack + hash)) return false;
      if (tmp = (dup.s[ack] || '').it) {
        if (hash === tmp['##']) return false;
        if (!tmp['##']) tmp['##'] = hash;
      }
    }

    if (!msg.dam && !msg['@']) {
      let i = 0;
      const to: string[] = [];
      tmp = opt.peers || {};
      for (const k in tmp) {
        const p = tmp[k];
        to.push(p.url || p.pid || p.id);
        if (++i > 6) break;
      }
      if (i > 1) msg['><'] = to.join();
    }

    if (msg.put && (tmp = msg.ok)) {
      msg.ok = {
        '@': (tmp['@'] || 1) - 1,
        '/': (tmp['/'] === msg._.near) ? mesh.near : tmp['/']
      };
    }

    const put = meta.$put;
    if (put) {
      const copy: any = {};
      Object.keys(msg).forEach(function (k: string) { copy[k] = msg[k]; });
      copy.put = ':])([:';
      json(copy, function (err: any, rawStr?: string) {
        if (err) return;
        tmp = rawStr!.indexOf('"put":":])([:"');
        res(undefined, rawStr!.slice(0, tmp! + 6) + put + rawStr!.slice(tmp! + 14));
      });
      return;
    }

    json(msg, res);

    function res(err: any, rawStr?: string) {
      if (err) return;
      meta.raw = rawStr;
      mesh.say(msg, peer);
    }
  };

  /* ─── hi ─── */

  mesh.near = 0;

  mesh.hi = function (peer: Peer): void {
    const wire = peer.wire;
    let tmp: any;

    if (!wire) {
      const entry = (peer as any).length
        ? { url: peer as any, id: peer as any }
        : peer;
      mesh.wire(entry);
      return;
    }

    if (peer.id) {
      opt.peers![peer.url || peer.id!] = peer;
    } else {
      tmp = peer.id = peer.id || peer.url || randomString(9);
      mesh.say({ dam: '?', pid: root.opt.pid }, opt.peers![tmp] = peer);
      if (peer.last) delete dup.s[peer.last!];
    }

    if (!peer.met) {
      mesh.near++;
      peer.met = +(new Date);
      root.on('hi', peer);
    }

    tmp = peer.queue;
    peer.queue = [];
    const sT = setTimeout as any;
    sT.each ? sT.each(tmp || [], function (msg: any) {
      send(msg, peer);
    }, 0, 9) : tmp && tmp.forEach(function (msg: any) {
      send(msg, peer);
    });
  };

  /* ─── bye ─── */

  mesh.bye = function (peer: Peer): void {
    if (peer.met) { mesh.near--; }
    delete peer.met;
    root.on('bye', peer);
    const tmp = +(new Date);
    mesh.bye.time = ((mesh.bye.time || tmp) + tmp) / 2;
  };
  mesh.bye.time = 0;

  /* ─── DAM handlers ─── */

  mesh.hear['!'] = function (msg: any, peer: Peer) {
    opt.log!('Error:', msg.err);
  };

  mesh.hear['?'] = function (msg: any, peer: Peer) {
    if (msg.pid) {
      if (!peer.pid) peer.pid = msg.pid;
      if (msg['@']) return;
    }
    mesh.say({ dam: '?', pid: opt.pid, '@': msg['#'] }, peer);
    if (peer.last) delete dup.s[peer.last!];
  };

  mesh.hear['mob'] = function (msg: any, peer: Peer) {
    if (!msg.peers) return;
    const peers = Object.keys(msg.peers);
    const one = peers[(Math.random() * peers.length) >> 0];
    if (!one) return;
    mesh.bye(peer);
    mesh.hi(one);
  };

  /* ─── lifecycle events ─── */

  root.on('create', function (this: any, r: any) {
    r.opt.pid = r.opt.pid || randomString(9);
    this.to.next(r);
    r.on('out', mesh.say);
  });

  root.on('bye', function (this: any, peer: Peer) {
    const target: any = opt.peers![peer.id || peer as any] || peer;
    this.to.next(target);
    if (target.bye) target.bye();
    else if (target.wire && target.wire.close) target.wire.close();
    delete opt.peers![target.id];
    target.wire = null;
  });

  const gets: Record<string, boolean> = {};
  root.on('bye', function (this: any, peer: Peer) {
    this.to.next(peer);
    let tmp: any;
    if (tmp = (console as any).STAT) { tmp.peers = mesh.near; }
    if (!(tmp = peer.url)) return;
    gets[tmp] = true;
    setTimeout(function () { delete gets[tmp]; }, opt.lack || 9000);
  });

  root.on('hi', function (this: any, peer: Peer) {
    this.to.next(peer);
    let tmp: any;
    if (tmp = (console as any).STAT) { tmp.peers = mesh.near; }
    if (opt.super) return;
    const souls = Object.keys(root.next || '');
    if (souls.length > 9999 && !(console as any).SUBS) {
      (console as any).SUBS = "Warning: You have more than 10K live GETs, which might use more bandwidth than your screen can show - consider `.off()`.";
      console.log((console as any).SUBS);
    }
    if ((setTimeout as any).each) {
      (setTimeout as any).each(souls, function (soul: string) {
        const node = root.next[soul];
        if (opt.super || (node.ask || '')['']) {
          mesh.say({ get: { '#': soul } }, peer);
          return;
        }
        (setTimeout as any).each(Object.keys(node.ask || ''), function (key: string) {
          if (!key) return;
          mesh.say({
            '##': (String as any).hash((root.graph[soul] || '')[key]),
            get: { '#': soul, '.': key }
          }, peer);
        });
      });
    }
  });

  return mesh;
}

export default createMesh;
