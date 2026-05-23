import Gun from '../gun/root';

var Gun2: any = Gun;

(Gun2.chain as any).open || require('./open');

var _on = (Gun2.chain as any).on;
(Gun2.chain as any).on = function(this: any, a: any, b?: any, c?: any){
	if('value' === a){
		return this.open(b, c);
	}
	return _on.call(this, a, b, c);
}

(Gun2.chain as any).bye || require('./bye');
(Gun2.chain as any).onDisconnect = (Gun2.chain as any).bye;
(Gun2.chain as any).connected = function(cb: any){
	var root = this.back(-1), last: any;
	root.on('hi', function(peer: any){
		if(!cb){ return }
		cb(last = true, peer);
	});
	root.on('bye', function(peer: any){
		if(!cb || last === peer){ return }
		cb(false, last = peer);
	});
	return this;
}
