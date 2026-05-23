declare var module: any;
import Gun from '../gun/root.js';

declare var require: any;
var Rad = ((Gun as any).window || {}).Radix || require('./radix');

(Gun as any).subs = Rad();

function input(this: any, msg: any){
  var at = this.as, to = this.to, peer = (msg._ || empty).via;
  var get = msg.get, soul: string, key: string;
  if(!peer || !get){ return to.next(msg) }
  if(soul = get['#']){
    if(key = get['.']){

    } else {

    }
    if (!peer.id) {console.log('[*** WARN] no peer.id %s', soul);}
    var subs = (Gun as any).subs(soul) || null;
    var tmp = subs ? subs.split(',') : [], p = at.opt.peers;
    if (subs) {
      (Gun as any).obj.map(subs.split(','), function(peerid: string) {
        if (peerid in p) { tmp.push(peerid); }
      });
    }
    if (tmp.indexOf(peer.id) === -1) { tmp.push(peer.id);}
    tmp = tmp.join(',');
    (Gun as any).subs(soul, tmp);
    var dht: any = {};
    dht[soul] = tmp;
    at.opt.mesh.say({dht:dht}, peer);
  }
  to.next(msg);
}
var empty: any = {}, u: any;
if((Gun as any).window){ /* skip input export in browser */ }
try{ (module as any).exports = input }catch(e){}
