import { Gun } from '../gun/root.js';

const noop = function () { };

(Gun.chain as any).promOnce = async function (limit?: any, opt?: any): Promise<any> {
  var gun: any = this, cat = gun._;
  if (!limit) { limit = 100 }
  if (cat.subs) {
    var array: any = [];
    gun.map().once((data: any, key: any) => {
      const g: any = this;
      array.push(new Promise((res: any) => {
        res({ ref: g, data: data, key: key });
      }));
    }, opt);
    await sleep(limit);
    return Promise.all(array);
  } else {
    return (new Promise((res: any) => {
      gun.once(function (this: any, data: any, key: any) {
        const g: any = this;
        res({ ref: g, data: data, key: key });
      }, opt);
    }));
  }
};

function sleep(limit: any): Promise<any> {
  return (new Promise((res: any) => {
    setTimeout(res, limit);
  }));
}

(Gun.chain as any).promPut = async function (item?: any, opt?: any): Promise<any> {
  var gun: any = this;
  return (new Promise((res: any) => {
    gun.put(item, function (ack: any) {
      if (ack.err) { console.log(ack.err); ack.ok = -1; res({ ref: gun, ack: ack }) }
      res({ ref: gun, ack: ack });
    }, opt);
  }));
};

(Gun.chain as any).promSet = async function (item?: any, opt?: any): Promise<any> {
  var gun: any = this, soul: any;
  var cb: any = noop;
  opt = opt || {}; opt.item = opt.item || item;
  return (new Promise(async function (res: any, rej: any) {
    if (soul = (Gun as any).node.soul(item)) { item = (Gun as any).obj.put({}, soul, (Gun as any).val.link.ify(soul)) }
    if (!Gun.is(item)) {
      if ((Gun as any).obj.is(item)) {
        item = await gun.back(-1).get(soul = soul || (Gun as any).node.soul(item) || gun.back('opt.uuid')()).promPut(item);
        item = item.ref;
      }
      res(gun.get(soul || ((Gun as any).state.lex() + (Gun as any).text.random(7))).promPut(item));
    }
    item.get(function (soul: any, o: any, msg: any) {
      var ack: any = {};
      if (!soul) { rej({ ack: { err: (Gun as any).log('Only a node can be linked! Not "' + msg.put + '"!') } }) }
      gun.put((Gun as any).obj.put({}, soul, (Gun as any).val.link.ify(soul)), cb, opt);
    }, true);
    res({ ref: item, ack: { ok: 0 } });
  }));
};

(Gun.chain as any).promOn = async function (callback?: any, option?: any): Promise<any> {
  var gun: any = this;
  return (new Promise((res: any) => {
    gun.on(function (data: any, key: any) {
      callback(data, key);
      res(data, key);
    }, option);
  }));
};