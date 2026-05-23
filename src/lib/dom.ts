declare var $: any;
;(function(){
	if((window as any).$){ return }
	var $fn: any = function(this: any, q: any, tag: any, I: any, u: any){
		if(q instanceof $){ return q }
		if(!((I = this) instanceof $)){ return new (($ as any))(q, tag) }
		if('string' != typeof q){ return I.tags = (q = q||[]).tags || (u === q.length)? [q] : q, I }
		if('<' === q[0]){ return I.add(q) }
		return q.split(",").forEach(function(q: any){ I.add((tag||document).querySelectorAll(q)) }), I;
	};
	(window as any).$ = $ = $fn;
	$.fn = $.prototype;
	$.fn.each = function(cb: any){ return $.each(this.tags, cb), this }
	$.each = function(o: any, cb: any){ Object.keys(o).forEach(function(k: any){ cb(k, o[k]) }) }
	$.isPlainObject = function(o: any){
		return (o? (o instanceof Object && o.constructor === Object)
		|| 'Object' === (Object.prototype.toString.call(o).match(/^\[object (\w+)\]$/)||[])[1]
		: false);
	}
	$.fn.add = function(add: any, tmp: any, u: any){ if(!add){ return this }
		if('<' === (tmp = add)[0]){ (add = document.createElement('div')).innerHTML = tmp; add = add.children[0] }
		add = ('string' == typeof add)? $(add).tags : (u == add.length)? add : [].slice.call(add);
		return this.tags = [].slice.call(this.tags||[]).concat(add), this;
	}
	$.fn.get = function(i: any, l: any, u: any){ return l = this.tags, (i === u)? l : l[i] }
	$.fn.is = function(q: any, b: any){ return this.each(function(i: any, tag: any){ b = b || tag.matches(q) }), b }
	$.fn.css = function(o: any){ return this.each(function(i: any, tag: any){ $.each(o, function(k: any,v: any){ tag.style[k] = v }) })}
	$.fn.on = function(t: any, cb: any){ return this.each(function(i: any, tag: any){
		t.split(" ").forEach(function(t: any){ tag.addEventListener(t, cb) });
	})}
	$.fn.val = function(t: any, k: any, f: any, u: any){
		t = (t === u)? '' : (f = 1) && t;
		k = k || 'value';
		return this.each(function(i: any, tag: any){
			if(f){ tag[k] = t }
			else { t += (tag[k]||'') }
		}), f? this : t;
	}
	$.fn.text = function(t: any){ return this.val(t, 'textContent') }
	$.fn.html = function(html: any){ return this.val(html, 'innerHTML') }
	$.fn.attr = function(attr: any,val: any){ return this.val(val, attr) }
	$.fn.find = function(q: any, I: any, l: any){
		I = $(), l = I.tags;
		return this.each(function(i: any, tag: any){
			$(q, tag).each(function(i: any, tag: any){
				if(0 > l.indexOf(tag)){ l.push(tag) }
			});
		}), I;
	}
	$.fn.place = function(where: any, on: any, f?: any, op?: any, I?: any){ return (I = this).each(function(i: any, tag: any){ $(on).each(function(i: any, node: any){
		((f? tag : node) as any)[op||'insertAdjacentElement']((({
			'-1':'beforebegin', '-0.1': 'afterbegin', '0.1':'beforeend', '1': 'afterend'
		}) as any)[where], (f? node : tag));
	})})}
	$.fn.append = function(html: any){ return $(html).place(0.1, this), this }
	$.fn.appendTo = function(html: any){ return this.place(0.1, $(html)) }
	function rev(o: any, I?: any){ (I = $()).tags = [].slice.call((o as any).tags).reverse(); return I };
	$.fn.prependTo = function(html: any){ return rev(this).place(-0.1, $(html)), this }
	$.fn.prepend = function(html: any){ return rev($(html)).place(-0.1, this), this }
	$.fn.parents = function(q: any, c: any, I: any, l: any, p: any){
		I = $(), l = I.tags, p = 'parentElement';
		this.each(function(i: any, tag: any){
			if(c){ (c as any) = {}; (c as any)[p] = tag ; tag = c }
			while(tag){ if((tag = tag[p]) && $(tag).is(q)){
				l.push(tag); if(c){ return }
			}}
		});
		return I;
	}
	$.fn.closest = function(q: any, c: any){ return this.parents(q, 1) }
	$.fn.clone = function(b: any, I: any, l: any){
		I = $(), l = I.tags;
		this.each(function(i: any, tag: any){
			l.push(tag.cloneNode(true))
		});
		return I;
	}
}());
