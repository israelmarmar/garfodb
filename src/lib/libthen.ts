import Gun from '../gun/root.js';

(Gun.chain as any).promise = function(cb: any) {
  var gun = this, cb = cb || function(ctx: any) { return ctx };
  return (new Promise(function(res: any, rej: any) {
    gun.once(function(this: any, data: any, key: any){
      res({put: data, get: key, gun: this});
    });
  })).then(cb);
};

(Gun.chain as any).then = function(cb: any) {
  var gun = this;
  var p = (new Promise((res: any, rej: any)=>{
    gun.once(function (this: any, data: any, key: any) {
      res(data, key);
    })
  }))
  return cb ? p.then(cb) : p;
};
