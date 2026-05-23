import { Gun, universe } from './root.js';
import { isValidValue } from '../core/valid.js';
import { isPlainObject } from '../core/shim.js';
import { createState, setState } from '../core/state.js';

const u = undefined;
const empty: any = {};
const noop = () => {};
const sT = setTimeout as any;
const turn = sT.turn || ((fn: () => void) => setTimeout(fn, 0));
const valid = isValidValue;
const stateIty = setState;

(Gun.chain as any).put = function put(this: Gun, data: any, cb?: any, as?: any): Gun {
  const gun = this;
  const at = gun._ as any;
  const root = at.root;

  as = as || {};
  as.root = at.root;
  as.run || (as.run = root.once);
  stun(as, at.id);
  as.ack = as.ack || cb;
  as.via = as.via || gun;
  as.data = as.data || data;
  as.soul || (as.soul = at.soul || (typeof cb === 'string' && cb));
  const s = as.state = as.state || createState();

  if (typeof data === 'function') {
    data((d: any) => { as.data = d; gun.put(u, u, as); });
    return gun;
  }

  if (!as.soul) { getSoulFn(as); return gun; }

  as.$ = root.$.get(as.soul);
  as.todo = [{ it: as.data, ref: as.$ }];
  as.turn = as.turn || turn;
  as.ran = as.ran || ran;

  (function walk() {
    const todo = as.todo;
    const current = todo.pop();
    let d = current.it;
    let k: string | undefined;
    let cat: any;
    let tmp: any;
    let g: any;

    stun(as, current.ref);

    if (tmp = current.todo) {
      k = tmp.pop();
      d = d[k!];
      if (tmp.length) { todo.push(current); }
    }

    if (k) {
      if (!todo.path) todo.path = [];
      todo.path.push(k);
    }

    if (!(tmp = valid(d)) && !(g = (Gun as any).is(d))) {
      if (!isPlainObject(d)) {
        const pathArr: any[] = [];
        const path = as.via.back((a: any) => { a.get && pathArr.push(a.get); }, pathArr) || pathArr.join('.') + '.' + (todo.path || []).join('.');
        ranErr(as, "Invalid data: " + check(d) + " at " + path);
        return;
      }
      const seen = as.seen || (as.seen = []);
      let i = seen.length;
      while (i--) {
        if (d === (tmp = seen[i]).it) {
          tmp = d = tmp.link;
          break;
        }
      }
    }

    if (k && tmp) {
      current.node = stateIty(current.node, k!, s, d);
    } else {
      if (!as.seen) { ranErr(as, "Data at root of graph must be a node (an object)."); return; }
      as.seen.push(cat = {
        it: d,
        link: {},
        todo: g ? [] : Object.keys(d).sort().reverse(),
        path: (todo.path || []).slice(),
        up: current,
      });
      current.node = stateIty(current.node, k!, s, cat.link);

      !g && cat.todo.length && todo.push(cat);

      const id = as.seen.length;
      (as.wait || (as.wait = {}))[id] = '';

      tmp = (cat.ref = (g ? d : k ? current.ref.get(k) : current.ref))._;
      const soulRef = (d?._ || '')['#'] || tmp?.soul || tmp?.link;
      if (soulRef) {
        resolve({ soul: soulRef });
      } else {
        cat.ref.get(resolve, {
          run: as.run,
          v2020: 1,
          out: { get: { '.': ' ' } }
        });
      }

      function resolve(msg: any, eve?: any) {
        const end = cat.link['#'];
        if (eve) { eve.off(); eve.rid(msg); }
        const soul = end || msg.soul ||
          (tmp = (msg.$$ || msg.$)?._ || '').soul || tmp.link ||
          ((tmp.put || '')._ || '')['#'] || tmp['#'] ||
          (((msg.put || '') && msg.$$) ? msg.put['#'] : (msg.put?.['='] || msg.put?.[':'] || '')['#']);
        !end && stun(as, msg.$);
        if (!soul && !cat.link['#']) {
          (cat.wait || (cat.wait = [])).push(() => resolve(msg, eve));
          return;
        }
        if (!soul) {
          const parts: string[] = [];
          (msg.$$ || msg.$).back((a: any) => {
            if (tmp = a.soul || a.link) return parts.push(tmp);
            parts.push(a.get);
          });
          cat.link['#'] = parts.reverse().join('/');
        } else {
          cat.link['#'] = soul;
        }
        !g && ((as.graph || (as.graph = {}))[cat.link['#']] = (cat.node || (cat.node = { _: {} })));
        as.graph[cat.link['#']] && ((as.graph[cat.link['#']] as any)._['#'] = cat.link['#']);
        delete as.wait[id];
        if (cat.wait) {
          for (let w = 0; w < cat.wait.length; w++) {
            cat.wait[w]();
          }
        }
        as.ran(as);
      }
    }

    if (!todo.length) { return as.ran(as); }
    as.turn(walk);
  })();

  return gun;
};

function stun(as: any, id: any): void {
  if (!id) return;
  id = (id._ || '').id || id;
  const root = as.root;
  const run = root.stun || (root.stun = { on: Gun.on });
  const test: any = {};
  as.stun || (as.stun = run.on('stun', () => {}));
  let tmp = run.on('' + id);
  if (tmp) {
    tmp = tmp.the ? tmp.the.last : tmp.last || tmp;
    if (tmp && tmp.next) tmp.next(test);
  }
  if (test.run >= as.run) return;
  run.on('' + id, function (this: any, testMsg: any) {
    if (as.stun.end) {
      this.off();
      this.to.next(testMsg);
      return;
    }
    testMsg.run = testMsg.run || as.run;
    testMsg.stun = testMsg.stun || as.stun;
    return;
  });
}

function ran(this: any, as: any): void {
  if (as.err) {
    ranEnd(as.stun, as.root);
    return;
  }
  if (as.todo.length || as.end || !isEmptyObj(as.wait)) return;
  as.end = 1;

  const cat = as.$.back(-1)._;
  const root = cat.root;
  let acks = 0;

  const ask = cat.ask((ackMsg: any) => {
    root.on('ack', ackMsg);
    if (ackMsg.err && !ackMsg.lack) { Gun.log(ackMsg); }
    if (++acks > (as.acks || 0)) { this?.off(); }
    if (!as.ack) return;
    as.ack(ackMsg, this);
  }, as.opt);

  const stunCtx = as.stun;
  const hatch = function (this: any) {
    if (!stunCtx) return;
    ranEnd(stunCtx, root);
    const adds = stunCtx.add || '';
    Object.keys(adds).forEach((cbId: string) => {
      const cb = adds[cbId];
      if (cb) cb();
    });
  };
  (hatch as any).hatch = hatch;

  if (as.ack && !as.ok) { as.ok = as.acks || 9; }
  (as.via._).on('out', {
    put: as.out = as.graph,
    ok: as.ok && { '@': as.ok + 1 },
    opt: as.opt,
    '#': ask,
    _: hatch,
  });
  as.root.on('out', {
    put: as.graph,
    '#': ask,
    out: universe,
    _: hatch,
  });
}

function ranEnd(stun: any, root: any): void {
  stun.end = noop;
  if (stun.the?.to === stun && stun === stun.the?.last) { delete root.stun; }
  stun.off();
}

function ranErr(as: any, err: string): void {
  (as.ack || noop).call(as, as.out = { err: as.err = Gun.log(err) });
  as.ran(as);
}

function getSoulFn(as: any): void {
  const at = as.via._;
  as.via = as.via.back((a: any) => {
    if (a.soul || !a.get) { return a.$; }
    const tmp = as.data;
    (as.data = {} as any)[a.get] = tmp;
  });
  if (!as.via || !as.via._.soul) {
    as.via = at.root.$.get(((as.data || '')._ || '')['#'] || at.$.back('opt.uuid')());
  }
  as.via.put(as.data, as.ack, as);
}

function check(d: any, tmp?: any): string {
  return ((d && (tmp = d.constructor) && tmp.name) || typeof d);
}

function isEmptyObj(o: any): boolean {
  if (!o) return true;
  for (const k in o) {
    if (Object.prototype.hasOwnProperty.call(o, k)) return false;
  }
  return true;
}
