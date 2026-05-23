import { Gun } from '../gun/root.js';

(Gun.chain as any).path = function (field?: any, opt?: any): any {
  var back = this, gun = back, tmp: any;
  if (typeof field === 'string') {
    tmp = field.split(opt || '.');
    if (1 === tmp.length) {
      gun = back.get(field);
      return gun;
    }
    field = tmp;
  }
  if (field instanceof Array) {
    if (field.length > 1) {
      gun = back;
      var i = 0, l = field.length;
      for (i; i < l; i++) {
        gun = gun.get(field[i]);
      }
    } else {
      gun = back.get(field[0]);
    }
    return gun;
  }
  if (!field && 0 != field) {
    return back;
  }
  gun = back.get('' + field);
  return gun;
};
