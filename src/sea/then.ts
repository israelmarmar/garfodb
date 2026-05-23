import Gun from '../gun/root.js';

Gun.chain.then = function (cb?: any, opt?: any) {
  var gun = this, p = (new Promise(function (res: any, rej: any) {
    gun.once(res, opt);
  }));
  return cb ? p.then(cb) : p;
}

export {};
