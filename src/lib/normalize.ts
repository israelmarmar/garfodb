declare var $: any;
(function(){

  ($ as any).normalize = function(html: any, customOpt: any){
    html = html || '';
    var root$: any, wrapped: any, opt: any;
    opt = html.opt || (customOpt ? prepareOptTags($.extend(true, baseOpt, customOpt))
                                 : defaultOpt);
    if(!html.opt){
      unstableList.length = 0;
      root$ = $('<div>'+html+'</div>');
    }
    (html.$ || root$).contents().each(function(this: any){
      if(this.nodeType === this.TEXT_NODE) {
      this.textContent = this.textContent.replace(/^[ \n]+|[ \n]+$/g, ' ');
        return;
      }
      var a: any = {$: $(this), opt: opt};
      initTag(a);
      ($ as any).normalize(a);
    });
    if(root$){
      stateMachine();
      return root$.html();
    }
  }

  var baseOpt: any = {
    hierarchy: ['div', 'pre', 'ol', 'ul', 'li',
                'h1', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a',
                'b', 'code', 'i', 'span', 's', 'sub', 'sup', 'u',
                'br', 'img']
    ,tags: {
      'a': {attrs:{'href':1}, exclude:{'a':1}},
      'b': {exclude:{'b':1,'p':1}},
      'br': {empty: 1},
      'i': {exclude:{'i':1,'p':1}},
      'img': {attrs:{'src':1}, empty: 1},
      'span': {exclude:{'p':1,'ul':1,'ol':1,'li':1,'br':1}},
      's': {space:1},
      'u': {exclude:{'u':1,'p':1},space:1},
    }
    ,convert: {
      'em': 'i', 'strong': 'b', 'strike': 's',
    }
    ,attrs: {
      'id':1
      ,'class':1
      ,'style':1
    }
    ,blockTag: function(a: any){
      return a.opt.tags[a.tag].order < a.opt.tags.a.order;
    }
    ,mutate: [exclude, moveSpaceUp, next, parentOrderWrap]
  }

  var defaultOpt = prepareOptTags($.extend(true, {}, baseOpt));

  var unstableList: any[] = [];

  function addUnstable(a: any) {
    if(!a.tag) { throw Error("not tag in " + a) }
    if(a.unstable) return;
    unstableList.push(a);
    a.unstable = true;
  }

  function initTag(a: any) {
    a.tag = tag(a.$);
      if(empty(a)) {
      return;
    }
    parseAndRemoveAttrs(a);
    convert(a);
    setAttrs(a);
    a.$[0].a = a;
    unstableList.push(a);
    a.unstable = true;
    return a;
  }

  function stateMachine() {
    if(unstableList.length===0)
      return;
    var a: any, i = -1;
    while (a = unstableList.pop()) {
      a.unstable = false;
      $(a.opt.mutate).each(function(i: any, fn: any){
        return fn && fn(a, addUnstable);
      });
    }
  }

  function prepareOptTags(opt: any) {
    var name: any, tag: any, tags = opt.tags;
    for(name in tags) {
      if(opt.hierarchy.indexOf(name)===-1)
        throw Error('tag "'+name+'" is missing hierarchy definition');
    }
    opt.hierarchy.forEach(function(name: any){
      if(!tags[name]){
        tags[name] = {attrs: opt.attrs};
      }
      (tag=tags[name]).attrs = $.extend(tag.attrs||{}, opt.attrs);
      tag.name = name;
      tag.order = opt.hierarchy.indexOf(name)
      if(tag.order === -1) {
      throw Error("Order of '"+name+"' not defined in hierarchy");
    }
    });
    return opt;
  }

  function get(o: any, args: any){
    if(typeof args === 'string')
      return o[args[0]];
    var i = 0, l = args.length, u: any;
    while((o = o[args[i++]]) != null && i < l){};
    return i < l ? u : o;
  }

  function has(obj: any,prop: any){
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function tag(e: any){
    return (($(e)[0]||{}).nodeName||'').toLowerCase();
  }

  function joint(e: any, d: any){
    d = (d? 'next' : 'previous') + 'Sibling';
    return $(($(e)[0]||{})[d]);
  }

  var xssattr = /[^a-z:]/ig, xssjs = /javascript:/ig;

  function attrsAsObj(e: any, filterCb: any){
    var attrObj: any = {};
    (e = $(e)) && e.length && $(e[0].attributes||[]).each(function(this: any, value: any, name: any){
      name = name.nodeName||name.name;
      value = e.attr(name);
      if(value.replace(xssattr,'').match(xssjs)){ e.removeAttr(name); return }
      value = filterCb? filterCb(value,name,e) : value;
      if(value !== undefined && value !== false)
        attrObj[name] = value;
    });
    return attrObj;
  }

  function sameAttrs(a: any, b: any) {
    return JSON.stringify(a.attr) === JSON.stringify(b.attr);
  }

  function parseAndRemoveAttrs(a: any) {
    a.attrs = [];
    var tag = a.opt.convert[a.tag] || a.tag,
    tOpt = a.opt.tags[tag];
    a.attr = tOpt && attrsAsObj(a.$, function(value: any, name: any){
    a.$.removeAttr(name);
    if(tOpt.attrs[name.toLowerCase()]){
      a.attrs.push(name)
      return value;
    }
    });
  }

  function setAttrs(a: any){
    var l  = function(ind: any, name: any){
      var t = name;
      name = a.attrs? name : ind;
      var value = a.attrs? a.attr[name.toLowerCase()] : t;
      a.$.attr(name, value);
    }
    a.attrs? $(a.attrs.sort()).each(l) : $.each(a.attr,l);
  }

  function convert(a: any){
    var t: any;
    if(t = a.opt.convert[a.tag]){
      a.$.replaceWith(a.$ = $('<'+ (a.tag = t.toLowerCase()) +'>').append(a.$.contents()));
    }
  }

  function exclude(a: any, addUnstable: any){
    var t = get(a.opt, ['tags', a.tag]),
    pt = get(a.opt, ['tags', tag(a.$.parent())]);
    if(!t || (pt && get(pt, ['exclude', a.tag]))){
      var c = a.$.contents();
      a.$.replaceWith(c);
      c.length===1 && c[0].a && addUnstable(c[0].a);
      return false;
    }
  }

  function moveSpaceUp(a: any, addUnstable: any){
    var n = a.$[0];
    if(moveSpace(n, true) + moveSpace(n, false)) {
      var c: any;
      if(n.textContent==='') {
        empty(a);
      } else if((c = a.$.contents()[0]) && c.a) {
        parentOrderWrap(c.a, addUnstable)
      }
    }
  }

  function moveSpace(n: any, bef: any) {
    var childRe  = bef? /^ / : / $/,
        parentRe = bef? / $/ : /^ /,
        c = bef? 'firstChild' : 'lastChild',
        s = bef? 'previousSibling' : 'nextSibling',
        sAdd = bef? 'after' : 'before',
        pAdd = bef? 'prepend' : 'append',
        n2: any;
    if(!n || !n[c] || n[c].nodeType !== n.TEXT_NODE || !n[c].wholeText.match(childRe)) {
      return 0;
    }
    if((n2 = n[s]) && !n.a.opt.blockTag(n.a)) {
      if(n2.nodeType === 3 && !n2.textContent.match(parentRe)) {
        n2.textContent = (bef?'':' ') + n2.textContent + (bef?' ':'');
      } else if(n2.nodeType === 1) {
        $(n2)[sAdd](' ');
      }
    } else if((n2 = n.parentNode) && !n.a.opt.blockTag(n.a)) {
      $(n2)[pAdd](' ');
    } else {
      return 0;
    }
    n[c].textContent = n[c].wholeText.replace(childRe, '');
    if(!n[c].wholeText.length)
      $(n[c]).remove();
    return 1;
  }

  function next(a: any, addUnstable: any, t: any){
    var t = t || joint(a.$, true), sm: any, t2: any;
    if(!t.length || a.opt.blockTag(a))
      return;
    if(a.opt.spaceMerge && t.length===1 && t[0].nodeType === 3 && t[0].wholeText===' '){
      if(!(t2 = joint(t, true)).length || a.opt.blockTag(t2[0].a))
        return;
      t.remove();
      t2.prepend(' ');
      return next(a, addUnstable, t2);
    }
    if(!t[0].a || a.tag !== t[0].a.tag || !sameAttrs(a, t[0].a))
      return;
    t.prepend(a.$.contents());
    empty(a);
    addUnstable(t[0].a);
    (t = t.children(":first")).length && addUnstable(t[0].a);
  }

  function empty(a: any){
    var t = a.opt.tags[a.tag];
    if((!t || !t.empty) && !a.$.contents().length && !a.$[0].attributes.length){
      a.$.remove();
      return true;
    }
  }

  function parentOrderWrap(a: any, addUnstable: any){
    var parent = a.$.parent(), children = parent.contents(),
    tags = a.opt.tags, ptag: any;

    if(children.length===1 && children[0] === a.$[0]
    && (ptag=tags[tag(parent)]) && ptag.order > tags[a.tag].order){
      parent.after(a.$);
      parent.append(a.$.contents());
      a.$.append(parent);
      addUnstable(parent[0].a);
      addUnstable(a);
    }
  }
})();
