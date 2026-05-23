import { User } from './user.js';

const SEA = (User as any).SEA;
const Gun = (User as any).GUN;
const noop = function () {};

User.prototype.create = function (...args: any[]) {
  var pair = typeof args[0] === 'object' && (args[0].pub || args[0].epub) ? args[0] : typeof args[1] === 'object' && (args[1].pub || args[1].epub) ? args[1] : null;
  var alias = pair && (pair.pub || pair.epub) ? pair.pub : typeof args[0] === 'string' ? args[0] : null;
  var pass = pair && (pair.pub || pair.epub) ? pair : alias && typeof args[1] === 'string' ? args[1] : null;
  var cb = args.filter(function (arg: any) { return typeof arg === 'function' })[0] || null;
  var opt = args && args.length > 1 && typeof args[args.length - 1] === 'object' ? args[args.length - 1] : {};

  var gun = this, cat = (gun._), root = gun.back(-1);
  cb = cb || noop;
  opt = opt || {};
  if (false !== opt.check) {
    var err;
    if (!alias) { err = "No user." }
    if ((pass || '').length < 8) { err = "Password too short!" }
    if (err) {
      cb({ err: Gun.log(err) });
      return gun;
    }
  }
  if (cat.ing) {
    (cb || noop)({ err: Gun.log("User is already being created or authenticated!"), wait: true });
    return gun;
  }
  cat.ing = true;
  var act: any = {}, u;
  act.a = function (pubs: any) {
    act.pubs = pubs;
    if (pubs && !opt.already) {
      var ack = { err: Gun.log('User already created!') };
      cat.ing = false;
      (cb || noop)(ack);
      gun.leave();
      return;
    }
    act.salt = (String as any).random(64);
    SEA.work(pass, act.salt, act.b);
  }
  act.b = function (proof: any) {
    act.proof = proof;
    pair ? act.c(pair) : SEA.pair(act.c);
  }
  act.c = function (pair: any) {
    var tmp;
    act.pair = pair || {};
    if (tmp = cat.root.user) {
      tmp._.sea = pair;
      tmp.is = { pub: pair.pub, epub: pair.epub, alias: alias };
    }
    act.data = { pub: pair.pub };
    act.d();
  }
  act.d = function () {
    act.data.alias = alias;
    act.e();
  }
  act.e = function () {
    act.data.epub = act.pair.epub;
    SEA.encrypt({ priv: act.pair.priv, epriv: act.pair.epriv }, act.proof, act.f, { raw: 1 });
  }
  act.f = function (auth: any) {
    act.data.auth = JSON.stringify({ ek: auth, s: act.salt });
    act.g(act.data.auth);
  }
  act.g = function (auth: any) {
    var tmp;
    act.data.auth = act.data.auth || auth;
    root.get(tmp = '~' + act.pair.pub).put(act.data).on(act.h);
    var link: any = {}; link[tmp] = { '#': tmp }; root.get('~@' + alias).put(link).get(tmp).on(act.i);
  }
  act.h = function (data: any, key: any, msg: any, eve: any) {
    eve.off(); act.h.ok = 1; act.i();
  }
  act.i = function (data?: any, key?: any, msg?: any, eve?: any) {
    if (eve) { act.i.ok = 1; eve.off() }
    if (!act.h.ok || !act.i.ok) { return }
    cat.ing = false;
    cb({ ok: 0, pub: act.pair.pub });
    if (noop === cb) { pair ? gun.auth(pair) : gun.auth(alias, pass) }
  }
  root.get('~@' + alias).once(act.a);
  return gun;
}

User.prototype.leave = function (opt?: any, cb?: any) {
  var gun = this, user = (gun.back(-1)._).user;
  if (user) {
    delete user.is;
    delete user._.is;
    delete user._.sea;
  }
  if ((SEA as any).window) {
    try {
      var sS: any = {};
      sS = (SEA as any).window.sessionStorage;
      delete sS.recall;
      delete sS.pair;
    } catch (e) { /* ignore */ }
  }
  return gun;
}

export { User };
export default User;
