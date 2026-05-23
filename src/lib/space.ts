import Gun from '../gun/root';

;(function(){
	var Gun2: any = Gun;
	var ify = Gun2.node.ify, empty = {}, u: any;
	console.log("Index space is beta, API may change!");
	(Gun2.chain as any).space = function(key: any, data: any, opt: any){
		if(data instanceof Function){
			return travel(key, data, opt, this);
		}
		var gun = this;
		if(Gun2.is(data)){
			data.get(function(soul: any){
				if(!soul){
					return cb && cb({err: "Indexspace cannot link `undefined`!"});
				}
				gun.space(key, Gun2.val.link.ify(soul), opt);
			}, true);
			return gun;
		}
		var cb = (opt instanceof Function && opt), rank = (opt||empty).rank || opt, root = gun.back(-1), tmp: any;
		gun.get(function(soul: any){
			if(!soul){
				soul = (gun.back('opt.uuid') || Gun2.text.random)(9);
			}
			var shell: any = {}, l = 0, tmp: any;
			var atom = Gun2.text.ify({get: key, put: data});
			tmp = {}; tmp[key] = data;
			shell.$ = ify(tmp, soul);
			tmp = {}; tmp[key.slice(0,l = 1)] = atom;
			shell[0] = ify(tmp, soul+'"');
			Gun2.list.map(index(1, key.length), function(i: any){
				tmp = {}; tmp[key.slice(l,i)] = atom;
				shell[i] = ify(tmp, soul+'"'+key.slice(0,l));
				l = i;
			});
			tmp = {}; tmp[key.slice(l, key.length)] = atom;
			shell[l+1] = ify(tmp, soul+'"'+key.slice(0,l));
			gun.put(shell, cb, {soul: soul, shell: shell});
		},true);
		return gun;
	}
	function travel(key: any, cb: any, opt: any, ref: any){
		var root = ref.back(-1), tmp: any;
		opt = opt || {};
		opt.ack = opt.ack || {};
		ref.get(function(soul: any){
			ref.get(key).get(function(msg: any, eve: any){
				eve.off();
				opt.exact = true;
				opt.ack.key = key;
				opt.ack.data = msg.put;
				if(opt.match){ cb(opt.ack, key, msg, eve) }
			});
			opt.soul = soul;
			opt.start = soul+'"';
			opt.key = key;
			opt.top = index(0, opt.find);
			opt.low = opt.top.reverse();
			find(opt, cb, root);
		}, true);
	}
	function find(o: any, cb: any, root: any){
		var id = o.start+o.key.slice(0,o.low[0]);
		root.get(id).get(function(msg: any, eve: any){
			eve.off();
			o.ack.tree = {};
			if(u === msg.put){
				if(!o.exact){ return o.match = true }
				cb(o.ack, id, msg, eve);
				return;
				o.low = o.low.slice(1);
				if(!o.low.length){
					cb(u, o.key, msg, eve);
					return;
				}
				find(o, cb, root);
				return;
			}
			Gun2.node.is(msg.put, function(v: any, k: any){
				if(!(k = Gun2.obj.ify(v) || empty).get){ return }
				o.ack.tree[k.get] = k.put;
			});
			if(!o.exact){ return o.match = true }
			cb(o.ack, id, msg, eve);
		});
	}
	function index(n: any, m: any, l?: any, k?: any): any {
		l = l || [];
		if(!m){ return l }
	  k = Math.ceil((n||1) / 10);
	  if((n+k) >= m){ return l }
	  l.push(n + k);
	  return index(n + k, m, l);
	}
}());
