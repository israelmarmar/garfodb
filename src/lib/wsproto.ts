declare var require: any;

import { Gun } from '../gun/root.js';

;(function(){
	var WebSocket: any;
	if(typeof window !== 'undefined'){
		WebSocket = (window as any).WebSocket || (window as any).webkitWebSocket || (window as any).mozWebSocket;
	} else {
		return;
	}
	(Gun as any).on('opt', function(this: any, ctx: any){
		this.to.next(ctx);
		var opt = ctx.opt;
		if(ctx.once){ return }
		opt.wsc = opt.wsc || {protocols:[]};
		var ws = opt.ws || (opt.ws = {}); ws.who = 0;
		(Gun as any).obj.map(opt.peers, function(){ ++ws.who });
		if(ctx.once){ return }
		var batch: any;

		ctx.on('out', function(this: any, at: any){
			this.to.next(at);
			if(at.ws && 1 == ws.who){ return }
			batch = JSON.stringify(at);
			if(ws.drain){
				ws.drain.push(batch);
				return;
			}
			ws.drain = [];
			setTimeout(function(){
				if(!ws.drain){ return }
				var tmp = ws.drain;
				ws.drain = null;
				if(!tmp.length){ return }
				batch = JSON.stringify(tmp);
				(Gun as any).obj.map(opt.peers, send, ctx);
			}, opt.wait || 1);
			(Gun as any).obj.map(opt.peers, send, ctx);
		});
		function send(this: any, peer: any){
			var ctx = this, msg = batch;
			var wire = peer.wire || open(peer, ctx);
			if(!wire){ return }
			if(wire.readyState === wire.OPEN){
				wire.send(msg);
				return;
			}
			(peer.queue = peer.queue || []).push(msg);
		}
		function receive(msg: any, peer: any, ctx: any){
			if(!ctx || !msg){ return }
			try{msg = JSON.parse(msg.data || msg);
			}catch(e){}
			if(msg instanceof Array){
				var i = 0, m: any;
				while(m = msg[i++]){
					receive(m, peer, ctx);
				}
				return;
			}
			if(1 == ws.who){ msg.ws = noop }
			ctx.on('in', msg);
		}
		function open(peer: any, as: any){
			if(!peer || !peer.url){ return }
			var url = peer.url.replace('http', 'ws');
			var wire = peer.wire = new WebSocket(url, as.opt.wsc.protocols, as.opt.wsc);
			wire.onclose = function(){
				reconnect(peer, as);
			};
			wire.onerror = function(error: any){
				reconnect(peer, as);
				if(!error){ return }
				if(error.code === 'ECONNREFUSED'){
				}
			};
			wire.onopen = function(){
				var queue = peer.queue;
				peer.queue = [];
				(Gun as any).obj.map(queue, function(msg: any){
					batch = msg;
					send.call(as, peer);
				});
			}
			wire.onmessage = function(msg: any){
				receive(msg, peer, as);
			};
			return wire;
		}
		function reconnect(peer: any, as: any){
			clearTimeout(peer.defer);
			peer.defer = setTimeout(function(){
				open(peer, as);
			}, 2 * 1000);
		}
	});
	var noop = function(){};
}());
