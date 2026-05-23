import { SEA } from './root.js';
import { s as S } from './settings.js';
import { Gun } from '../gun/root.js';

const u = undefined;
const noop = function () { };

Gun.on('opt', function (this: any, at: any) {
  if (!at.sea) {
    at.sea = { own: {} };
    at.on('put', check, at);
  }
  this.to.next(at);
});

function check(this: any, msg: any) {
  var eve = this, at = eve.as, put = msg.put, soul = put['#'], key = put['.'], val = put[':'], state = put['>'], id = msg['#'], tmp;
  if (!soul || !key) { return }
  if ((msg._ || '').faith && (at.opt || '').faith && 'function' == typeof msg._) {
    (SEA as any).opt.pack(put, function (raw: any) {
      SEA.verify(raw, false, function (data: any) {
        put['='] = (SEA as any).opt.unpack(data);
        eve.to.next(msg);
      })
    })
    return
  }
  var no = function (why?: any) { at.on('in', { '@': id, err: msg.err = why }) };
  (msg._ || '').DBG && ((msg._ || '').DBG.c = +new Date);
  if (0 <= soul.indexOf('<?')) {
    tmp = parseFloat(soul.split('<?')[1] || '');
    if (tmp && (state < (Gun.state() - (tmp * 1000)))) {
      (tmp = msg._) && (tmp.stun) && (tmp.stun--);
      return;
    }
  }

  if ('~@' === soul) {
    check.alias(eve, msg, val, key, soul, at, no); return;
  }
  if ('~@' === soul.slice(0, 2)) {
    check.pubs(eve, msg, val, key, soul, at, no); return;
  }
  if (tmp = (SEA as any).opt.pub(soul)) {
    check.pub(eve, msg, val, key, soul, at, no, at.user || '', tmp); return;
  }
  if (0 <= soul.indexOf('#')) {
    check.hash(eve, msg, val, key, soul, at, no); return;
  }
  check.any(eve, msg, val, key, soul, at, no, at.user || '');
  eve.to.next(msg);
}

check.hash = function (eve: any, msg: any, val: any, key: any, soul: any, at: any, no: any) {
  SEA.work(val, null, function (data: any) {
    function hexToBase64(hexStr: string) {
      let base64 = "";
      for (let i = 0; i < hexStr.length; i++) {
        base64 += !(i - 1 & 1) ? String.fromCharCode(parseInt(hexStr.substring(i - 1, i + 1), 16)) : ""
      }
      return btoa(base64);
    }
    if (data && data === key.split('#').slice(-1)[0]) { return eve.to.next(msg) }
    else if (data && data === hexToBase64(key.split('#').slice(-1)[0])) {
      return eve.to.next(msg)
    }
    no("Data hash not same as hash!");
  }, { name: 'SHA-256' });
}

check.alias = function (eve: any, msg: any, val: any, key: any, soul: any, at: any, no: any) {
  if (!val) { return no("Data must exist!") }
  if ('~@' + key === link_is(val)) { return eve.to.next(msg) }
  no("Alias not same!");
};

check.pubs = function (eve: any, msg: any, val: any, key: any, soul: any, at: any, no: any) {
  if (!val) { return no("Alias must exist!") }
  if (key === link_is(val)) { return eve.to.next(msg) }
  no("Alias not same!");
};

check.pub = async function (eve: any, msg: any, val: any, key: any, soul: any, at: any, no: any, user: any, pub: any) {
  var tmp;
  const raw = await S.parse(val) || {}
  const verify = (certificate: any, certificant: any, cb: any) => {
    if (certificate.m && certificate.s && certificant && pub)
      return SEA.verify(certificate, pub, function (data: any) {
        if (u !== data && u !== data.e && msg.put['>'] && msg.put['>'] > parseFloat(data.e)) return no("Certificate expired.")
        if (u !== data && data.c && data.w && (data.c === certificant || data.c.indexOf(certificant || '*') > -1)) {
          let path = soul.indexOf('/') > -1 ? soul.replace(soul.substring(0, soul.indexOf('/') + 1), '') : ''
          ;(String as any).match = (String as any).match || (Gun as any).text.match
          const w = Array.isArray(data.w) ? data.w : typeof data.w === 'object' || typeof data.w === 'string' ? [data.w] : []
          for (const lex of w) {
            if ((((String as any).match as Function)(path, lex['#']) && ((String as any).match as Function)(key, lex['.'])) || (!lex['.'] && ((String as any).match as Function)(path, lex['#'])) || (!lex['#'] && ((String as any).match as Function)(key, lex['.'])) || ((String as any).match as Function)((path ? path + '/' + key : key), lex['#'] || lex)) {
              if (lex['+'] && lex['+'].indexOf('*') > -1 && path && path.indexOf(certificant) == -1 && key.indexOf(certificant) == -1) return no(`Path "${path}" or key "${key}" must contain string "${certificant}".`)
              if (data.wb && (typeof data.wb === 'string' || ((data.wb || {})['#']))) {
                var root = eve.as.root.$.back(-1)
                if (typeof data.wb === 'string' && '~' !== data.wb.slice(0, 1)) root = root.get('~' + pub)
                return root.get(data.wb).get(certificant).once(function (value: any) {
                  if (value && (value === 1 || value === true)) return no(`Certificant ${certificant} blocked.`)
                  return cb(data)
                })
              }
              return cb(data)
            }
          }
          return no("Certificate verification fail.")
        }
      })
    return
  }

  if ('pub' === key && '~' + pub === soul) {
    if (val === pub) return eve.to.next(msg)
    return no("Account not same!")
  }

  if ((tmp = user.is) && tmp.pub && !raw['*'] && !raw['+'] && (pub === tmp.pub || (pub !== tmp.pub && ((msg._.msg || {}).opt || {}).cert))) {
    (SEA as any).opt.pack(msg.put, function (packed: any) {
      SEA.sign(packed, (user._).sea, async function (data: any) {
        if (u === data) return no((SEA as any).err || 'Signature fail.')
        msg.put[':'] = { ':': tmp = (SEA as any).opt.unpack(data.m), '~': data.s }
        msg.put['='] = tmp

        if (pub === user.is.pub) {
          if (tmp = link_is(val)) { ((at.sea.own[tmp] = at.sea.own[tmp] || {}) as any)[pub] = 1 }
          ((JSON as any).stringifyAsync as Function)(msg.put[':'], function (err: any, s: string) {
            if (err) { return no(err || "Stringify error.") }
            msg.put[':'] = s;
            return eve.to.next(msg);
          })
          return
        }

        if (pub !== user.is.pub && ((msg._.msg || {}).opt || {}).cert) {
          const cert = await S.parse(msg._.msg.opt.cert)
          if (cert && cert.m && cert.s)
            verify(cert, user.is.pub, function (_: any) {
              msg.put[':']['+'] = cert
              msg.put[':']['*'] = user.is.pub
              ;((JSON as any).stringifyAsync as Function)(msg.put[':'], function (err: any, s: string) {
                if (err) { return no(err || "Stringify error.") }
                msg.put[':'] = s;
                return eve.to.next(msg);
              })
              return
            })
        }
      }, { raw: 1 })
    })
    return;
  }

  (SEA as any).opt.pack(msg.put, function (packed: any) {
    SEA.verify(packed, raw['*'] || pub, function (data: any) {
      var tmp;
      data = (SEA as any).opt.unpack(data);
      if (u === data) return no("Unverified data.")
      if ((tmp = link_is(data)) && pub === (SEA as any).opt.pub(tmp)) (at.sea.own[tmp] = at.sea.own[tmp] || {})[pub] = 1

      if (raw['+'] && raw['+']['m'] && raw['+']['s'] && raw['*'])
        verify(raw['+'], raw['*'], function (_: any) {
          msg.put['='] = data;
          return eve.to.next(msg);
        })
      else {
        msg.put['='] = data;
        return eve.to.next(msg);
      }
    });
  })
  return
};

check.any = function (eve: any, msg: any, val: any, key: any, soul: any, at: any, no: any, user: any) {
  var tmp, pub;
  if (at.opt.secure) { return no("Soul missing public key at '" + key + "'.") }
  at.on('secure', function (this: any, msg: any) {
    this.off();
    if (!at.opt.secure) { return eve.to.next(msg) }
    no("Data cannot be changed.");
  }).on.on('secure', msg);
  return;
}

var valid = Gun.valid, link_is = function (d: any, l?: any) { return 'string' == typeof (l = valid(d)) && l }, state_ify = (Gun.state || '').ify;

var pubcut = /[^\w_-]/;
(SEA as any).opt.pub = function (s?: any) {
  if (!s) { return }
  s = s.split('~');
  if (!s || !(s = s[1])) { return }
  s = s.split(pubcut).slice(0, 2);
  if (!s || 2 != s.length) { return }
  if ('@' === (s[0] || '')[0]) { return }
  s = s.slice(0, 2).join('.');
  return s;
};
(SEA as any).opt.stringy = function (t?: any) {
};
(SEA as any).opt.pack = function (d: any, cb: any, k?: any, n?: any, s?: any) {
  var tmp, f;
  if ((SEA as any).opt.check(d)) { return cb(d) }
  if (d && d['#'] && d['.'] && d['>']) { tmp = d[':']; f = 1 }
  (JSON as any).parseAsync(f ? tmp : d, function (err: any, meta: any) {
    var sig = ((u !== (meta || '')[':']) && (meta || '')['~']);
    if (!sig) { cb(d); return }
    cb({ m: { '#': s || d['#'], '.': k || d['.'], ':': (meta || '')[':'], '>': d['>'] || Gun.state.is(n, k) }, s: sig });
  });
}
var fl = Math.floor;
var O = (SEA as any).opt;
(SEA as any).opt.unpack = function (d: any, k?: any, n?: any) {
  var tmp;
  if (u === d) { return }
  if (d && (u !== (tmp = d[':']))) { return tmp }
  k = k || O.fall_key; if (!n && O.fall_val) { n = {}; n[k] = O.fall_val }
  if (!k || !n) { return }
  if (d === n[k]) { return d }
  if (!(SEA as any).opt.check(n[k])) { return d }
  var soul = (n && n._ && n._['#']) || O.fall_soul, sstate = Gun.state.is(n, k) || O.fall_state;
  if (d && 4 === d.length && soul === d[0] && k === d[1] && fl(sstate) === fl(d[3])) {
    return d[2];
  }
  if (sstate < (SEA as any).opt.shuffle_attack) {
    return d;
  }
};
(SEA as any).opt.shuffle_attack = 1546329600000;

export {};
