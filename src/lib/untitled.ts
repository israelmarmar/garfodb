import Gun from '../gun/root';
declare var $: any;
declare var cb: any;

var u: any;
var echo: any;
var obj_map: any;
var gun = Gun;

function input(this: any, msg: any): void {
  var ev = this, cat = this.as, gun = msg.gun, at = gun._, change = msg.put, rel: any, tmp: any;
  if(u === change){
    if(cat.soul || cat.has){
      if(cat.soul && u !== cat.put){
        return;
      }
      ev.to.next(msg);
      echo(cat, msg, ev);
      if(cat.soul){ return }
      obj_map(cat.next, unknown);
    }
    if(cat.has){
      // incomplete stub
    }
    return;
  }
  if(cat.soul){
    return;
  }
  if(cat.has){
    return;
  }
  if(cat.get){
    return;
  }
  ev.to.next(msg);
}

function unknown(ref: any, key: any){
  (ref = (ref._)).put = u;
  ref.on('in', {get: key, put: u, gun: ref.gun});
}

(gun as any).get('users').map().map().get('who').get('say').map().on(cb as any);
