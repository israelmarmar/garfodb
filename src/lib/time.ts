import Gun from '../gun/root';

;(function(){
	var Gun2: any = Gun;
	var ify = Gun2.node.ify, u: any;
	(Gun2.chain as any).time = function(data: any, a: any, b: any){
		if(data instanceof Function){
			return travel(data, a, b, this);
		}
		var gun = this, root = gun.back(-1);
		var cb = (a instanceof Function && a) || (b instanceof Function && b);
		if(Gun2.is(data)){
			data.get(function(soul: any){
				if(!soul){
					return cb && cb({err: "Timegraph cannot link `undefined`!"});
				}
				gun.time(Gun2.val.link.ify(soul), a, b);
			}, true);
			return gun;
		}
		var opt = (cb === a)? b : a;
		opt = Gun2.text.is(opt)? {key: opt} : opt || {};
		var t = new Date(Gun2.state()).toISOString().split(/[\-t\:\.z]/ig);
		var p: any, tmp = t.pop();
		gun.get(function(soul: any){
			var id = soul;
			p = id;
			if(!p){ id = p = (gun.back('opt.uuid') || Gun2.text.random)(9) }
			t = [p].concat(t);
			var rid = opt.key || (gun.back('opt.uuid') || Gun2.text.random)(9);
			var milli = ify({}, t.join(':'));
			milli[rid] = data;
			tmp = t.pop();
			var sec = ify({}, t.join(':'));
			sec[tmp!] = milli;
			tmp = t.pop();
			var min = ify({}, t.join(':'));
			min[tmp!] = sec;
			tmp = t.pop();
			var hour = ify({}, t.join(':'));
			hour[tmp!] = min;
			tmp = t.pop();
			var day = ify({}, t.join(':'));
			day[tmp!] = hour;
			tmp = t.pop();
			var month = ify({}, t.join(':'));
			month[tmp!] = day;
			tmp = t.pop();
			var year = ify({}, t.join(':'));
			year[tmp!] = month;
			tmp = t.pop();
			var time = ify({}, t.join(':') || id);
			time[tmp!] = year;
			gun.put(time, cb);
		}, true);
		return gun;
	}
	function travel(cb: any, opt: any, b: any, gun: any){
		var root = gun.back(-1), tmp: any;
		(opt = Gun2.num.is(opt)? {last: opt} : opt || {}).seen = opt.seen || {};
		var t = now(opt.start);
		gun.on(function(data: any, key: any, msg: any, eve: any){
			var at = msg.$._, id = at.link || at.soul || Gun2.node.soul(data);
			if(!id){ return }
			if(false === opt.next){ eve.off() }
			else { opt.next = true }
			opt.start = [opt.id = id].concat(t);
			opt.low = opt.low || opt.start;
			opt.top = opt.top || opt.start;
			opt.now = [id].concat(now());
			find(opt, cb, root, opt.at? opt.now : opt.at = opt.start);
		});
		return gun;
	}
	function now(t?: any): any {
		return new Date(t || Gun2.state()).toISOString().split(/[\-t\:\.z]/ig).slice(0,-1);
	}
	function find(o: any, cb: any, root: any, at: any, off?: any){
		var at = at || o.at, t = at.join(':'), tmp: any;
		if(!off){
			if(o.seen[t]){ return }
			o.seen[t] = true;
		}
		var next = (o.low || o.start)[at.length];
		root.get(t).get(function(this: any, msg: any, ev: any){
			if(off){ ev.off() }
			var g = this;
			if(u === msg.put){
				find(o, cb, root, at.slice(0,-1), off);
				return;
			}
			if(7 < at.length){
				var l = Object.keys(msg.put).length;
				if(l === o.seen[t]){ return }
				var when = +(toDate(at));
				Gun2.node.is(msg.put, function(v: any, k: any){
					cb(v, k, when, ev);
					if(o.last){ --o.last }
				});
				o.seen[t] = l;
				if(!o.last){ return }
				if(o.last <= 0){ return }
				o.low = at;
				var tmp = at.slice(0,-1);
				find(o, cb, root, tmp, true);
				return;
			}
			if(o.last && false !== off){
				var keys = Object.keys(msg.put).sort().reverse();
				var less = Gun2.list.map(keys, function(k: any){
					if(parseFloat(k) < parseFloat(next)){ return k }
				});
				if(!less){
					find(o, cb, root, at.slice(0,-1), true);
				} else {
					var tmp = (at || o.at).slice();
					tmp.push(less);
					(o.low = tmp.slice()).push(Infinity);
					find(o, cb, root, tmp, true);
				}
			}
			if(off){ return }
			if(!o.next){ return }
			if(at < o.start.slice(0, at.length)){ return }
			var n = [o.id].concat(now()), top = n[at.length];
			Gun2.node.is(msg.put, function(v: any, k: any){
				if(k > top){ return }
				(v = at.slice()).push(k);
				find(o, cb, root, v, false);
			});
		})
	}
	function toDate(at: any){
		at = at.slice(-7);
		return new Date(Date.UTC(at[0], parseFloat(at[1])-1, at[2], at[3], at[4], at[5], at[6]));
	}
}());
