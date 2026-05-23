import { User } from './user.js';

const SEA = (User as any).SEA;
const Gun = (User as any).GUN;

User.prototype.recall = function (opt?: any, cb?: any) {
  var gun = this, root = gun.back(-1), tmp;
  opt = opt || {};
  if (opt && opt.sessionStorage) {
    if ((SEA as any).window) {
      try {
        var sS: any = {};
        sS = (SEA as any).window.sessionStorage;
        if (sS) {
          (root._).opt.remember = true;
          ((gun.back('user')._).opt || opt).remember = true;
          if (sS.recall || sS.pair) root.user().auth(JSON.parse(sS.pair), cb);
        }
      } catch (e) { /* ignore */ }
    }
    return gun;
  }
  return gun;
}

export { User };
export default User;
