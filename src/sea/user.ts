import { SEA } from './root.js';
import GunImport from '../gun/root.js';

const u = undefined;
let Gun: any = GunImport;
(SEA as any).GUN = Gun;

function User(this: any, root?: any) {
  this._ = { $: this };
}
User.prototype = (function () { function F() { }; F.prototype = Gun.chain; return new (F as any)() }());
User.prototype.constructor = User;

Gun.chain.user = function (pub?: any) {
  var gun = this, root = gun.back(-1), user;
  if (pub) {
    pub = (SEA as any).opt.pub((pub._ || '')['#']) || pub;
    return root.get('~' + pub);
  }
  if (user = root.back('user')) { return user }
  var root_ = (root._), at = root_, uuid = at.opt.uuid || lex;
  (at = (user = at.user = gun.chain(new (User as any)()))._).opt = {};
  at.opt.uuid = function (cb?: any) {
    var id = uuid(), pub = root_.user;
    if (!pub || !(pub = pub.is) || !(pub = pub.pub)) { return id }
    id = '~' + pub + '/' + id;
    if (cb && cb.call) { cb(null, id) }
    return id;
  }
  return user;
}

function lex() { return Gun.state().toString(36).replace('.', '') }

Gun.User = User;
(User as any).GUN = Gun;
(User as any).SEA = Gun.SEA = SEA;

export { User };
export default User;
