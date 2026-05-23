import { Gun } from './root.js';
import { isValidValue } from '../core/valid.js';

const valid = isValidValue;

(Gun.chain as any).set = function set(this: Gun, item: any, cb?: any, opt?: any): Gun {
  const gun = this;
  const root = gun.back(-1);
  let soul: string, tmp: any;

  cb = cb || (() => {});
  opt = opt || {};
  opt.item = opt.item || item;

  if (soul = ((item?._ || '')['#'])) {
    item = { '#': soul };
  }

  if (typeof (tmp = valid(item)) === 'string') {
    return gun.get(soul = tmp).put(item, cb, opt);
  }

  if (!(Gun as any).is(item)) {
    if (item && typeof item === 'object' && item.constructor === Object) {
      item = root.get(soul = gun.back('opt.uuid')()).put(item);
    }
    return gun.get(soul || root.back('opt.uuid')(7)).put(item, cb, opt);
  }

  gun.put((go: any) => {
    item.get((soulId: string) => {
      if (!soulId) {
        return cb.call(gun, { err: Gun.log('Only a node can be linked! Not "' + (arguments as any)[2]?.put + '"!') });
      }
      const tmp: any = {};
      tmp[soulId] = { '#': soulId };
      go(tmp);
    }, true);
  });

  return item;
};
