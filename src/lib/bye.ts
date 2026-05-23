import Gun from '../gun/root.js';

(Gun as any).on('create', function(this: any, root: any){
  this.to.next(root);
  var mesh = root.opt.mesh;
  if(!mesh){ return }
  mesh.hear['bye'] = function(msg: any, peer: any){
    (peer.byes = peer.byes || []).push(msg.bye);
  }
  root.on('bye', function(this: any, peer: any){
    this.to.next(peer);
    if(!peer.byes){ return }
    var gun = root.$;
    (Gun as any).obj.map(peer.byes, function(data: any){
      (Gun as any).obj.map(data, function(put: any, soul: string){
        gun.get(soul).put(put);
      });
    });
    peer.byes = [];
  });
});

(Gun.chain as any).bye = function(){
  var gun = this, bye = gun.chain(), root = gun.back(-1), put = bye.put;
  bye.put = function(data: any){
    gun.back(function(this: any, at: any){
      if(!at.get){ return }
      var tmp = data;
      (data as any)[at.get] = tmp;
    });
    root.on('out', {bye: data});
    return gun;
  }
  return bye;
}
