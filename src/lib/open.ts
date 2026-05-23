import { Gun } from '../gun/root.js';

(Gun.chain as any).open = function (cb?: any, opt?: any, at?: any, depth?: any): any {
  depth = depth || 1;
  opt = opt || {};
  opt.doc = opt.doc || {};
  opt.ids = opt.ids || {};
  opt.any = opt.any || cb;
  opt.meta = opt.meta || false;
  opt.eve = opt.eve || {
    off: function () {
      Object.keys(opt.eve.s).forEach(function (i: any, e: any) {
        if (e = opt.eve.s[i]) { e.off() }
      });
      opt.eve.s = {};
    }, s: {}
  };
  const self: any = this;
  return self.on(function (data: any, key: any, ctx: any, eve: any) {
    clearTimeout(opt.to);
    opt.to = setTimeout(function () {
      if (!opt.any) { return }
      opt.any.call(opt.at.$, opt.doc, opt.key, opt, opt.eve);
      if (opt.off) {
        opt.eve.off();
        opt.any = null;
      }
    }, opt.wait || 9);
    opt.at = opt.at || ctx;
    opt.key = opt.key || key;
    opt.eve.s[data?._?.id || ctx?._?.id] = eve;
    if (true === Gun.valid(data)) {
      if (!at) {
        opt.doc = data;
      } else {
        at[key] = data;
      }
      return;
    }
    const tmp = self;
    for (const k of Object.keys(data || {})) {
      const v = data[k];
      if ('_' === k && !opt.meta) { continue }
      const doc = at || opt.doc;
      if (!doc) { continue }
      const id: any = Gun.valid(v);
      if ('string' !== typeof id) {
        doc[k] = v;
        continue;
      }
      if (opt.ids[id]) {
        doc[k] = opt.ids[id];
        continue;
      }
      if (opt.depth <= depth) {
        doc[k] = doc[k] || v;
        continue;
      }
      tmp.get(k).open(opt.any, opt, opt.ids[id] = doc[k] = {}, depth + 1);
    }
  });
};