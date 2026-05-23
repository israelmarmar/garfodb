import Gun from '../gun/root';

;(function(){
	var u: any;
	if(''+u == typeof Gun){ return }
	var DEP = function(n: any){ console.log("Warning! Deprecated internal utility will break in next version:", n) }
	var Type: any = Gun;
	Type.fn = Type.fn || {is: function(fn: any){ DEP('fn'); return (!!fn && 'function' == typeof fn) }}
	Type.bi = Type.bi || {is: function(b: any){ DEP('bi');return (b instanceof Boolean || typeof b == 'boolean') }}
	Type.num = Type.num || {is: function(n: any){ DEP('num'); return !list_is(n) && ((n - parseFloat(n) + 1) >= 0 || Infinity === n || -Infinity === n) }}
	Type.text = Type.text || {is: function(t: any){ DEP('text'); return (typeof t == 'string') }}
	Type.text.ify = Type.text.ify || function(t: any){ DEP('text.ify');
		if(Type.text.is(t)){ return t }
		if(typeof JSON !== "undefined"){ return JSON.stringify(t) }
		return (t && t.toString)? t.toString() : t;
	}
	Type.text.random = Type.text.random || function(l: any, c: any){ DEP('text.random');
		var s = '';
		l = l || 24;
		c = c || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz';
		while(l > 0){ s += c.charAt(Math.floor(Math.random() * c.length)); l-- }
		return s;
	}
	Type.text.match = Type.text.match || function(t: any, o: any){ var tmp: any, u: any; DEP('text.match');
		if('string' !== typeof t){ return false }
		if('string' == typeof o){ o = {'=': o} }
		o = o || {};
		tmp = (o['='] || o['*'] || o['>'] || o['<']);
		if(t === tmp){ return true }
		if(u !== o['=']){ return false }
		tmp = (o['*'] || o['>'] || o['<']);
		if(t.slice(0, (tmp||'').length) === tmp){ return true }
		if(u !== o['*']){ return false }
		if(u !== o['>'] && u !== o['<']){
			return (t >= o['>'] && t <= o['<'])? true : false;
		}
		if(u !== o['>'] && t >= o['>']){ return true }
		if(u !== o['<'] && t <= o['<']){ return true }
		return false;
	}
	Type.text.hash = Type.text.hash || function(s: any, c: any){
		DEP('text.hash');
		if(typeof s !== 'string'){ return }
	  c = c || 0;
	  if(!s.length){ return c }
	  for(var i=0,l=s.length,n: any; i<l; ++i){
	    n = s.charCodeAt(i);
	    c = ((c<<5)-c)+n;
	    c |= 0;
	  }
	  return c;
	}
	Type.list = Type.list || {is: function(l: any){ DEP('list'); return (l instanceof Array) }}
	Type.list.slit = Type.list.slit || Array.prototype.slice;
	Type.list.sort = Type.list.sort || function(k: any){
		DEP('list.sort');
		return function(A: any, B: any){
			if(!A || !B){ return 0 } A = A[k]; B = B[k];
			if(A < B){ return -1 }else if(A > B){ return 1 }
			else { return 0 }
		}
	}
	Type.list.map = Type.list.map || function(l: any, c: any, _: any){ DEP('list.map'); return obj_map(l, c, _) }
	Type.list.index = 1;
	Type.obj = Type.boj || {is: function(o: any){ DEP('obj'); return o? (o instanceof Object && o.constructor === Object) || (Object.prototype.toString.call(o).match(/^\[object (\w+)\]$/)||[])[1] === 'Object' : false }}
	Type.obj.put = Type.obj.put || function(o: any, k: any, v: any){ DEP('obj.put'); return (o||{})[k] = v, o }
	Type.obj.has = Type.obj.has || function(o: any, k: any){ DEP('obj.has'); return o && Object.prototype.hasOwnProperty.call(o, k) }
	Type.obj.del = Type.obj.del || function(o: any, k: any){ DEP('obj.del'); 
		if(!o){ return }
		o[k] = null;
		delete o[k];
		return o;
	}
	Type.obj.as = Type.obj.as || function(o: any, k: any, v: any, u: any){ DEP('obj.as'); return o[k] = o[k] || (u === v? {} : v) }
	Type.obj.ify = Type.obj.ify || function(o: any){ DEP('obj.ify'); 
		if(obj_is(o)){ return o }
		try{o = JSON.parse(o);
		}catch(e){o={}};
		return o;
	}
	;(function(){ var u: any;
		function map(this: any, v: any, k: any){
			if(obj_has(this,k) && u !== this[k]){ return }
			this[k] = v;
		}
		Type.obj.to = Type.obj.to || function(from: any, to: any){ DEP('obj.to'); 
			to = to || {};
			obj_map(from, map, to);
			return to;
		}
	}());
	Type.obj.copy = Type.obj.copy || function(o: any){ DEP('obj.copy');
		return !o? o : JSON.parse(JSON.stringify(o));
	}
	;(function(){
		function empty(this: any, v: any, i: any){ var n: any = this.n, u: any;
			if(n && (i === n || (obj_is(n) && obj_has(n, i)))){ return }
			if(u !== i){ return true }
		}
		Type.obj.empty = Type.obj.empty || function(o: any, n: any){ DEP('obj.empty'); 
			if(!o){ return true }
			return obj_map(o,empty,{n:n})? false : true;
		}
	}());
	;(function(){
		var t: any = function(k: any, v: any){
			if(2 === arguments.length){
				t.r = t.r || {};
				t.r[k] = v;
				return;
			} t.r = t.r || [];
			t.r.push(k);
		};
		var keys = Object.keys, map: any, u: any;
		Object.keys = Object.keys || function(o: any){ return map(o, function(v: any, k: any, t: any){t(k)}) }
		Type.obj.map = map = Type.obj.map || function(l: any, c: any, _: any){ DEP('obj.map'); 
			var u: any, i: any = 0, x: any, r: any, ll: any, lle: any, f = 'function' == typeof c;
			t.r = u;
			if(keys && obj_is(l)){
				ll = keys(l); lle = true;
			}
			_ = _ || {};
			if(list_is(l) || ll){
				x = (ll || l).length;
				for(;i < x; i++){
					var ii = (i + Type.list.index);
					if(f){
						r = lle? c.call(_, l[ll[i]], ll[i], t) : c.call(_, l[i], ii, t);
						if(r !== u){ return r }
					} else {
						if(c === l[lle? ll[i] : i]){ return ll? ll[i] : ii }
					}
				}
			} else {
				for(i in l){
					if(f){
						if(obj_has(l,i)){
							r = _? c.call(_, l[i], i, t) : c(l[i], i, t);
							if(r !== u){ return r }
						}
					} else {
						if(c === l[i]){ return i }
					}
				}
			}
			return f? t.r : Type.list.index? 0 : -1;
		}
	}());
	Type.time = Type.time || {};
	Type.time.is = Type.time.is || function(t: any){ DEP('time'); return t? t instanceof Date : (+new Date().getTime()) }

	var fn_is = Type.fn.is;
	var list_is = Type.list.is;
	var obj = Type.obj, obj_is = obj.is, obj_has = obj.has, obj_map = obj.map;

	var Val: any = {};
	Val.is = function (v: any) {
	  DEP("val.is");
	  return v === null ||
		"string" === typeof v ||
		"boolean" === typeof v ||
		("number" === typeof v && v != Infinity && v != -Infinity && v === v) ||
		(!!v && "string" == typeof v["#"] && Object.keys(v).length === 1 && v["#"]);
	};
	Val.link = Val.rel = {_: '#'};
	;(function(){
		Val.link.is = function(v: any){ DEP('val.link.is');
			if(v && v[rel_] && !v._ && obj_is(v)){
				var o: any = {};
				obj_map(v, map, o);
				if(o.id){
					return o.id;
				}
			}
			return false;
		}
		function map(this: any, s: any, k: any){ var o = this;
			if(o.id){ return o.id = false }
			if(k == rel_ && text_is(s)){
				o.id = s;
			} else {
				return o.id = false;
			}
		}
	}());
	Val.link.ify = function(t: any){ DEP('val.link.ify'); return obj_put({}, rel_, t) }
	Type.obj.has._ = '.';
	var rel_ = Val.link._, u: any;
	var bi_is = Type.bi.is;
	var num_is = Type.num.is;
	var text_is = Type.text.is;
	var obj = Type.obj, obj_is = obj.is, obj_put = obj.put, obj_map = obj.map;

	Type.val = Type.val || Val;

	var Node: any = {_: '_'};
	Node.soul = function(n: any, o: any){ DEP('node.soul'); return (n && n._ && n._[o || soul_]) }
	Node.soul.ify = function(n: any, o: any){ DEP('node.soul.ify');
		o = (typeof o === 'string')? {soul: o} : o || {};
		n = n || {};
		n._ = n._ || {};
		n._[soul_] = o.soul || n._[soul_] || text_random();
		return n;
	}
	Node.soul._ = Val.link._;
	;(function(){
		Node.is = function(n: any, cb: any, as: any){ DEP('node.is'); var s: any;
			if(!obj_is(n)){ return false }
			if(s = Node.soul(n)){
				return !obj_map(n, map, {as: as, cb: cb, s: s, n: n});
			}
			return false;
		}
		function map(this: any, v: any, k: any){
			if(k === Node._){ return }
			if(!Val.is(v)){ return true }
			if(this.cb){ this.cb.call(this.as, v, k, this.n, this.s) }
		}
	}());
	;(function(){
		Node.ify = function(obj: any, o: any, as: any){ DEP('node.ify');
			if(!o){ o = {} }
			else if(typeof o === 'string'){ o = {soul: o} }
			else if('function' == typeof o){ o = {map: o} }
			if(o.map){ o.node = o.map.call(as, obj, u, o.node || {}) }
			if(o.node = Node.soul.ify(o.node || {}, o)){
				obj_map(obj, map, {o: o, as: as});
			}
			return o.node;
		}
		function map(this: any, v: any, k: any){ var o = this.o, tmp: any, u: any;
			if(o.map){
				tmp = o.map.call(this.as, v, ''+k, o.node);
				if(u === tmp){
					obj_del(o.node, k);
				} else
				if(o.node){ o.node[k] = tmp }
				return;
			}
			if(Val.is(v)){
				o.node[k] = v;
			}
		}
	}());
	var obj = Type.obj, obj_is = obj.is, obj_del = obj.del, obj_map = obj.map;
	var text = Type.text, text_random = text.random;
	var soul_ = Node.soul._;
	var u: any;
	Type.node = Type.node || Node;

	var State = Type.state;
	State.lex = function(){ DEP('state.lex'); return State().toString(36).replace('.','') }
	State.to = function(from: any, k: any, to: any){ DEP('state.to'); 
		var val = (from||{})[k];
		if(obj_is(val)){
			val = obj_copy(val);
		}
		return State.ify(to, k, State.is(from, k), val, Node.soul(from));
	}
	;(function(){
		State.map = function(cb: any, s: any, as: any){ DEP('state.map'); var u: any;
			var o: any = obj_is(o = cb || s)? o : null;
			cb = fn_is(cb = cb || s)? cb : null;
			if(o && !cb){
				s = num_is(s)? s : State();
				o[N_] = o[N_] || {};
				obj_map(o, map, {o: o, s: s});
				return o;
			}
			as = as || obj_is(s)? s : u;
			s = num_is(s)? s : State();
			return function(this: any, v: any, k: any, o: any, opt: any){
				if(!cb){
					map.call({o: o, s: s}, v, k);
					return v;
				}
				cb.call(as || this || {}, v, k, o, opt);
				if(obj_has(o,k) && u === o[k]){ return }
				map.call({o: o, s: s}, v, k);
			}
		}
		function map(this: any, v: any, k: any){
			if(N_ === k){ return }
			State.ify(this.o, k, this.s) ;
		}
	}());
	var obj = Type.obj, obj_as = obj.as, obj_has = obj.has, obj_is = obj.is, obj_map = obj.map, obj_copy = obj.copy;
	var num = Type.num, num_is = num.is;
	var fn = Type.fn, fn_is = fn.is;
	var N_ = Node._, u: any;

	var Graph: any = {};
	;(function(){
		Graph.is = function(g: any, cb: any, fn: any, as: any){ DEP('graph.is');
			if(!g || !obj_is(g) || obj_empty(g)){ return false }
			return !obj_map(g, map, {cb: cb, fn: fn, as: as});
		}
		function map(this: any, n: any, s: any){
			if(!n || s !== Node.soul(n) || !Node.is(n, this.fn, this.as)){ return true }
			if(!this.cb){ return }
			nf.n = n; nf.as = this.as;
			this.cb.call(nf.as, n, s, nf);
		}
		var nf: any = function(fn: any){
			if(fn){ Node.is(nf.n, fn, nf.as) }
		}
	}());
	;(function(){
		Graph.ify = function(obj: any, env: any, as: any){ DEP('graph.ify'); 
			var at: any = {path: [], obj: obj};
			if(!env){
				env = {};
			} else
			if(typeof env === 'string'){
				env = {soul: env};
			} else
			if('function' == typeof env){
				env.map = env;
			}
			if(typeof as === 'string'){
				env.soul = env.soul || as;
				as = u;
			}
			if(env.soul){
				at.link = Val.link.ify(env.soul);
			}
			env.shell = (as||{}).shell;
			env.graph = env.graph || {};
			env.seen = env.seen || [];
			env.as = env.as || as;
			node(env, at);
			env.root = at.node;
			return env.graph;
		}
		function node(env: any, at: any){ var tmp: any;
			if(tmp = seen(env, at)){ return tmp }
			at.env = env;
			at.soul = soul;
			if(Node.ify(at.obj, map, at)){
				at.link = at.link || Val.link.ify(Node.soul(at.node));
				if(at.obj !== env.shell){
					env.graph[Val.link.is(at.link)] = at.node;
				}
			}
			return at;
		}
		function map(this: any, v: any, k: any, n: any){
			var at = this, env = at.env, is: any, tmp: any;
			if(Node._ === k && obj_has(v,Val.link._)){
				return n._;
			}
			if(!(is = valid(v,k,n, at,env))){ return }
			if(!k){
				at.node = at.node || n || {};
				if(obj_has(v, Node._) && Node.soul(v)){
					at.node._ = obj_copy(v._);
				}
				at.node = Node.soul.ify(at.node, Val.link.is(at.link));
				at.link = at.link || Val.link.ify(Node.soul(at.node));
			}
			if(tmp = env.map){
				tmp.call(env.as || {}, v, k, n, at);
				if(obj_has(n,k)){
					v = n[k];
					if(u === v){
						obj_del(n, k);
						return;
					}
					if(!(is = valid(v,k,n, at,env))){ return }
				}
			}
			if(!k){ return at.node }
			if(true === is){
				return v;
			}
			tmp = node(env, {obj: v, path: at.path.concat(k)});
			if(!tmp.node){ return }
			return tmp.link;
		}
		function soul(this: any, id: any){ var at = this;
			var prev = Val.link.is(at.link), graph = at.env.graph;
			at.link = at.link || Val.link.ify(id);
			at.link[Val.link._] = id;
			if(at.node && at.node[Node._]){
				at.node[Node._][Val.link._] = id;
			}
			if(obj_has(graph, prev)){
				graph[id] = graph[prev];
				obj_del(graph, prev);
			}
		}
		function valid(v: any, k: any, n: any, at: any, env: any){ var tmp: any;
			if(Val.is(v)){ return true }
			if(obj_is(v)){ return 1 }
			if(tmp = env.invalid){
				v = tmp.call(env.as || {}, v, k, n);
				return valid(v, k, n, at, env);
			}
			env.err = "Invalid value at '" + at.path.concat(k).join('.') + "'!";
			if(Type.list.is(v)){ env.err += " Use `.set(item)` instead of an Array." }
		}
		function seen(env: any, at: any){
			var arr = env.seen, i = arr.length, has: any;
			while(i--){ has = arr[i];
				if(at.obj === has.obj){ return has }
			}
			arr.push(at);
		}
	}());
	Graph.node = function(node: any){ DEP('graph.node'); 
		var soul = Node.soul(node);
		if(!soul){ return }
		return obj_put({}, soul, node);
	}
	;(function(){
		Graph.to = function(graph: any, root: any, opt: any){ DEP('graph.to'); 
			if(!graph){ return }
			var obj: any = {};
			opt = opt || {seen: {}};
			obj_map(graph[root], map, {obj: obj, graph: graph, opt: opt});
			return obj;
		}
		function map(this: any, v: any, k: any){ var tmp: any, obj: any;
			if(Node._ === k){
				if(obj_empty(v, Val.link._)){
					return;
				}
				this.obj[k] = obj_copy(v);
				return;
			}
			if(!(tmp = Val.link.is(v))){
				this.obj[k] = v;
				return;
			}
			if(obj = this.opt.seen[tmp]){
				this.obj[k] = obj;
				return;
			}
			this.obj[k] = this.opt.seen[tmp] = Graph.to(this.graph, tmp, this.opt);
		}
	}());
	var fn_is = Type.fn.is;
	var obj = Type.obj, obj_is = obj.is, obj_del = obj.del, obj_has = obj.has, obj_empty = obj.empty, obj_put = obj.put, obj_map = obj.map, obj_copy = obj.copy;
	var u: any;
	Type.graph = Type.graph || Graph;
}());
