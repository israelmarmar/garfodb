import { User } from './user.js';

const SEA = (User as any).SEA;
const Gun = (User as any).GUN;
const noop = function () {};

User.prototype.auth = function (...args: any[]) {
  var pair = typeof args[0] === 'object' && (args[0].pub || args[0].epub) ? args[0] : typeof args[1] === 'object' && (args[1].pub || args[1].epub) ? args[1] : null;
  var alias = !pair && typeof args[0] === 'string' ? args[0] : null;
  var pass = (alias || (pair && !(pair.priv && pair.epriv))) && typeof args[1] === 'string' ? args[1] : null;
  var cb = args.filter(function (arg: any) { return typeof arg === 'function' })[0] || null;
  var opt = args && args.length > 1 && typeof args[args.length - 1] === 'object' ? args[args.length - 1] : {};
  var retries = typeof opt.retries === 'number' ? opt.retries : 9;

  var gun = this, cat = (gun._), root = gun.back(-1);

  if (cat.ing) {
    (cb || noop)({ err: Gun.log("User is already being created or authenticated!"), wait: true });
    return gun;
  }
  cat.ing = true;

  var act: any = {}, u: any;
  act.a = function (data: any) {
    if (!data) { return act.b() }
    if (!data.pub) {
      var tmp: any[] = []; Object.keys(data).forEach(function (k: any) { if ('_' == k) { return } tmp.push(data[k]) });
      return act.b(tmp);
    }
    if (act.name) { return act.f(data) }
    act.c((act.data = data).auth);
  }
  act.b = function (list?: any) {
    var get = (act.list = (act.list || []).concat(list || [])).shift();
    if (u === get) {
      if (act.name) { return act.err('Your user account is not published for dApps to access, please consider syncing it online, or allowing local access by adding your device as a peer.') }
      if (alias && retries--) {
        root.get('~@' + alias).once(act.a);
        return;
      }
      return act.err('Wrong user or password.')
    }
    root.get(get).once(act.a);
  }
  act.c = function (auth: any) {
    if (u === auth) { return act.b() }
    if ('string' == typeof auth) { return act.c(obj_ify(auth)) }
    SEA.work(pass, (act.auth = auth).s, act.d, act.enc);
  }
  act.d = function (proof: any) {
    SEA.decrypt(act.auth.ek, proof, act.e, act.enc);
  }
  act.e = function (half: any) {
    if (u === half) {
      if (!act.enc) {
        act.enc = { encode: 'utf8' };
        return act.c(act.auth);
      } act.enc = null;
      return act.b();
    }
    act.half = half;
    act.f(act.data);
  }
  act.f = function (pair: any) {
    var half = act.half || {}, data = act.data || {};
    act.g(act.lol = { pub: pair.pub || data.pub, epub: pair.epub || data.epub, priv: pair.priv || half.priv, epriv: pair.epriv || half.epriv });
  }
  act.g = function (pair: any) {
    if (!pair || !pair.pub || !pair.epub) { return act.b() }
    act.pair = pair;
    var user = (root._).user, at = (user._);
    var tmp = at.tag;
    var upt = at.opt;
    at = user._ = root.get('~' + pair.pub)._;
    at.opt = upt;
    user.is = { pub: pair.pub, epub: pair.epub, alias: alias || pair.pub };
    at.sea = act.pair;
    cat.ing = false;
    try { if (pass && u == (obj_ify(cat.root.graph['~' + pair.pub].auth) || '')[':']) { opt.shuffle = opt.change = pass; } } catch (e) { /* ignore */ }
    opt.change ? act.z() : (cb || noop)(at);
    if ((SEA as any).window && ((gun.back('user')._).opt || opt).remember) {
      try {
        var sS: any = {};
        sS = (SEA as any).window.sessionStorage;
        sS.recall = true;
        sS.pair = JSON.stringify(pair);
      } catch (e) { /* ignore */ }
    }
    try {
      if (root._.tag.auth) {
        (root._).on('auth', at)
      } else { setTimeout(function () { (root._).on('auth', at) }, 1) }
    } catch (e) {
      Gun.log("Your 'auth' callback crashed with:", e);
    }
  }
  act.h = function (data: any) {
    if (!data) { return act.b() }
    alias = data.alias
    if (!alias)
      alias = data.alias = "~" + pair.pub
    if (!data.auth) {
      return act.g(pair);
    }
    pair = null;
    act.c((act.data = data).auth);
  }
  act.z = function () {
    act.salt = (String as any).random(64);
    SEA.work(opt.change, act.salt, act.y);
  }
  act.y = function (proof: any) {
    SEA.encrypt({ priv: act.pair.priv, epriv: act.pair.epriv }, proof, act.x, { raw: 1 });
  }
  act.x = function (auth: any) {
    act.w(JSON.stringify({ ek: auth, s: act.salt }));
  }
  act.w = function (auth: any) {
    if (opt.shuffle) {
      console.log('migrate core account from UTF8 & shuffle');
      var tmp: any = {}; Object.keys(act.data).forEach(function (k: any) { tmp[k] = act.data[k] });
      delete tmp._;
      tmp.auth = auth;
      root.get('~' + act.pair.pub).put(tmp);
    }
    root.get('~' + act.pair.pub).get('auth').put(auth, cb || noop);
  }
  act.err = function (e?: any) {
    var ack = { err: Gun.log(e || 'User cannot be found!') };
    cat.ing = false;
    (cb || noop)(ack);
  }
  act.plugin = function (name: any) {
    if (!(act.name = name)) { return act.err() }
    var tmp = [name];
    if ('~' !== name[0]) {
      tmp[1] = '~' + name;
      tmp[2] = '~@' + name;
    }
    act.b(tmp);
  }
  if (pair) {
    if (pair.priv && pair.epriv)
      act.g(pair);
    else
      root.get('~' + pair.pub).once(act.h);
  } else
    if (alias) {
      root.get('~@' + alias).once(act.a);
    } else
      if (!alias && !pass) {
        SEA.name(act.plugin);
      }
  return gun;
}

function obj_ify(o: any): any {
  if ('string' != typeof o) { return o }
  try { o = JSON.parse(o); } catch (e) { o = {} };
  return o;
}

export { User };
export default User;
