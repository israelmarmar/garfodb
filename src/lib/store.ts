import { Gun } from '../gun/root.js';
import { createRadisk, Radisk as RadiskNS } from './radisk.js';
import { createRadix, Radix } from './radix.js';

declare var process: any;

const u = undefined;
const esc = String.fromCharCode(27);

export function setupRadStore(): void {
  Gun.on('create', function (this: any, root: any) {
    if ((Gun as any).TESTING) { root.opt.file = 'radatatest'; }
    this.to.next(root);
    const opt = root.opt;
    if (opt.rad === false || opt.radisk === false) return;

    if ((typeof process !== u) && 'false' === '' + (process as any).env?.RAD) return;

    const RadiskCtor: any = createRadisk;
    const dare = RadiskCtor(opt);
    const now = Gun.state();

    root.on('put', function (this: any, msg: any) {
      this.to.next(msg);
      if ((msg._ || '').rad) return;
      const id = msg['#'];
      const put = msg.put;
      const soul = put['#'];
      const key = put['.'];
      const val = put[':'];
      const state = put['>'];

      dare(soul + esc + key, { ':': val, '>': state }, function (err: any, ok?: any) {
        if (err) { root.on('in', { '@': id, err }); return; }
        root.on('in', { '@': id, ok });
      });
    });

    root.on('get', function (this: any, msg: any) {
      this.to.next(msg);
      const id = msg['#'];
      const get = msg.get;
      const soul = get['#'];
      const has = get['.'] || '';
      const o: any = {};
      let graph: any;
      let key: any;
      let tmp: any;
      let force: any;

      if (typeof soul === 'string') {
        key = soul;
      } else if (soul) {
        if (u !== (tmp = soul['*'])) { o.limit = force = 1; }
        if (u !== soul['>']) { o.start = soul['>']; }
        if (u !== soul['<']) { o.end = soul['<']; }
        key = force ? ('' + tmp) : tmp || soul['='];
        force = null;
      }

      if (key && !o.limit) {
        if (typeof has === 'string') {
          key = key + esc + (o.atom = has);
        } else if (has) {
          if (u !== has['>']) { o.start = has['>']; o.limit = 1; }
          if (u !== has['<']) { o.end = has['<']; o.limit = 1; }
          if (u !== (tmp = has['*'])) { o.limit = force = 1; }
          if (key) {
            key = key + esc + (force ? ('' + (tmp || '')) : tmp || (o.atom = has['='] || ''));
          }
        }
      }

      if ((tmp = get['%']) || o.limit) {
        o.limit = (tmp <= (o.pack || (1000 * 100))) ? tmp : 1;
      }
      if ((has && has['-']) || (soul || {})['-'] || get['-']) { o.reverse = true; }

      if ((tmp = (root.next || '')[soul]) && tmp.put) {
        if (o.atom) {
          const subNext = (tmp.next || '')[o.atom];
          if (subNext && subNext.root && subNext.root.graph && subNext.root.graph[soul] && subNext.root.graph[soul][o.atom]) {
            return;
          }
        } else if (tmp.rad) {
          return;
        }
      }

      dare(key || '', function (this: any, err: any, data?: any, info?: any) {
        info = info || '';
        let va: any, ve: any;

        if (info.unit && data && u !== (va = data[':']) && u !== (ve = data['>'])) {
          const parts = key.split(esc);
          const so = parts[0];
          const ha = parts[1];
          (graph = graph || {})[so] = Gun.state.ify(graph[so], ha, ve, va, so);
          root.$.get(so).get(ha)._.rad = now;
        } else if (data) {
          if (typeof data !== 'string') {
            if (o.atom) {
              data = u;
            } else {
              Radix.map(data, eachVal, o);
            }
          }
          if (!graph && data) { eachVal(data, ''); }
          if (!o.atom && !has && typeof soul === 'string' && !o.limit && !o.more) {
            root.$.get(soul)._.rad = now;
          }
        }

        const faith: any = function () { };
        faith.faith = true;
        faith.rad = get;

        root.on('in', {
          '@': id,
          put: graph,
          '%': info.more ? 1 : u,
          err: err || u,
          _: faith,
        });

        graph = u;

        function eachVal(val: any, _has: string): any {
          if (!val) return;
          const parts = (key + _has).split(esc);
          const so = parts[0];
          const haStr = parts.slice(-1)[0];

          if (o.limit && o.limit <= (o.count || 0)) return true;
          let va2: any, ve2: any;

          if (typeof val !== 'string') {
            va2 = val[':'];
            ve2 = val['>'];
            (graph = graph || {})[so] = Gun.state.ify(graph[so], haStr, ve2, va2, so);
            o.count = (o.count || 0) + ((va2 || '').length || 9);
            return;
          }

          o.count = (o.count || 0) + val.length;
          const tmp2 = val.lastIndexOf('>');
          const state = RadiskNS.decode(val.slice(tmp2 + 1), null, esc);
          val = RadiskNS.decode(val.slice(0, tmp2), null, esc);
          (graph = graph || {})[so] = Gun.state.ify(graph[so], haStr, state, val, so);
        }
      }, o);
    });
  });
}

export default setupRadStore;
