import { User } from './user.js';

const SEA = (User as any).SEA;
const Gun = (User as any).GUN;
const noop = function () {};
declare var authRecall: any;

User.prototype.pair = function () {
  var user = this, proxy;
  try {
    proxy = new Proxy({ DANGER: '\u2620' }, {
      get: function (t: any, p: any, r: any) {
        if (!user.is || !(user._ || '').sea) { return }
        return user._.sea[p];
      }
    })
  } catch (e) { /* ignore */ }
  return proxy;
}

User.prototype.delete = async function (alias: any, pass: any, cb?: any) {
  console.log("user.delete() IS DEPRECATED AND WILL BE MOVED TO A MODULE!!!");
  var gun = this, root = gun.back(-1), user = gun.back('user');
  try {
    user.auth(alias, pass, function (ack: any) {
      var pub = (user.is || {}).pub;
      user.map().once(function (this: any) { this.put(null) });
      user.leave();
      (cb || noop)({ ok: 0 });
    });
  } catch (e) {
    Gun.log('User.delete failed! Error:', e);
  }
  return gun;
}

User.prototype.alive = async function () {
  console.log("user.alive() IS DEPRECATED!!!");
  const gunRoot = this.back(-1);
  try {
    await authRecall(gunRoot);
    return gunRoot._.user._;
  } catch (e) {
    const err = 'No session!';
    Gun.log(err);
    throw { err };
  }
}

User.prototype.trust = async function (user: any) {
  console.log("`.trust` API MAY BE DELETED OR CHANGED OR RENAMED, DO NOT USE!");
  var path: any, theirPubkey: any;
  if (Gun.is(user)) {
    user.get('pub').get((ctx: any, ev: any) => {
      console.log(ctx, ev);
    })
  }
  user.get('trust').get(path).put(theirPubkey);
}

User.prototype.grant = function (to: any, cb?: any) {
  console.log("`.grant` API MAY BE DELETED OR CHANGED OR RENAMED, DO NOT USE!");
  var gun = this, user = gun.back(-1).user(), pair = user._.sea, path = '';
  gun.back(function (at: any) { if (at.is) { return } path += (at.get || '') });
  (async function () {
    var enc, sec = await user.get('grant').get(pair.pub).get(path).then();
    sec = await SEA.decrypt(sec, pair);
    if (!sec) {
      sec = SEA.random(16).toString();
      enc = await SEA.encrypt(sec, pair);
      user.get('grant').get(pair.pub).get(path).put(enc);
    }
    var pub = to.get('pub').then();
    var epub = to.get('epub').then();
    pub = await pub; epub = await epub;
    var dh = await SEA.secret(epub, pair);
    enc = await SEA.encrypt(sec, dh);
    user.get('grant').get(pub).get(path).put(enc, cb);
  }());
  return gun;
}

User.prototype.secret = function (data: any, cb?: any) {
  console.log("`.secret` API MAY BE DELETED OR CHANGED OR RENAMED, DO NOT USE!");
  var gun = this, user = gun.back(-1).user(), pair = user.pair(), path = '';
  gun.back(function (at: any) { if (at.is) { return } path += (at.get || '') });
  (async function () {
    var enc, sec = await user.get('trust').get(pair.pub).get(path).then();
    sec = await SEA.decrypt(sec, pair);
    if (!sec) {
      sec = SEA.random(16).toString();
      enc = await SEA.encrypt(sec, pair);
      user.get('trust').get(pair.pub).get(path).put(enc);
    }
    enc = await SEA.encrypt(data, sec);
    gun.put(enc, cb);
  }());
  return gun;
}

export { User };
export default User;
