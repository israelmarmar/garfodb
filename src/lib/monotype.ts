declare var window: any;

var monotype: any = monotype || (function (monotype: any) {
  monotype.range = function (n: any) {
    var R: any, s: any, t: any, n = n || 0, win = monotype.win || window, doc = win.document;
    if (!arguments.length) return doc.createRange();
    if (!(win.Range && R instanceof Range)) {
      s = win.getSelection ? win.getSelection() : {};
      if (s.rangeCount) {
        R = s.getRangeAt(n);
      } else {
        if (doc.createRange) {
          R = doc.createRange();
        }
      }
    }
    return R;
  };
  monotype.win = function (w: any) {
    monotype.win = w || monotype.win || window;
    return monotype;
  };
  monotype.save = function (t: any, R: any) {
    var s: any, r: any, n: any, i: any, j: any, e: any, o: any, k: any, m: any, doc = t && t[0] ? t[0].ownerDocument : document;
    R = R || (monotype.saved ? monotype.saved() : false);
    if (!R) { return }
    r = R.cloneRange ? R.cloneRange() : R;
    n = t && t[0] ? t[0] : R.startContainer;
    if (n && n.parentElement) {
      i = n.parentElement.innerHTML;
      if (i) {
        i = i.slice(0, R.startOffset);
        s = i.match(/\n|$/g);
        s = s && s.length || 0;
      }
    }
    e = R.endContainer;
    if (e && e.parentElement) {
      i = e.parentElement.innerHTML;
      if (i) {
        i = i.slice(0, R.endOffset);
        e = i.match(/\n|$/g);
        e = e && e.length || 0;
      }
    }
    return { R: r, s: s || 0, e: e || 0, n: n, t: t };
  };
  monotype.restore = function (o: any) {
    if (!o) { return }
    var c = o && o.R;
    if (c) {
      monotype.saved = function () { return c; };
    }
  };
  monotype.set = function (t: any, opt: any, s: any, R: any) {
    var o: any, n: any, i: any, j: any, e: any, r: any;
    if (typeof t === 'string') {
      if (opt && ((opt || '') === 'right' || (opt || '') === 'end')) {
        i = t;
        o = monotype(t);
        o = o && o[0];
        if (o) {
          n = o.lastChild || o;
          R = document.createRange();
          try { R.setStartAfter(n); } catch (e) { }
          try { R.setEndAfter(n); } catch (e) { }
          return R;
        }
      }
      if (opt === 'start') {
        o = monotype(t);
        o = o && o[0] && o[0].firstChild;
        if (o) {
          return monotype.set(o);
        }
      }
      return monotype.set(monotype(t), opt);
    }
    if (t && t.length && t[0] && t[0].nodeType) {
      o = t[0];
      if (opt && opt.nodeType) {
        s = opt;
      }
    }
    if (!t) { return }
    if (t.nodeType) {
      o = t;
    }
    if (opt && opt.push && opt.nodeType) {
      s = opt;
    }
    if (opt && opt.nodeType) {
      s = s || opt;
    }
    if (opt && !s) {
      s = opt;
    }
    if (!o) {
      o = t;
      if (o && o.length && o[0] && o[0].nodeType) {
        o = o[0];
      }
    }
    if (opt && opt.constructor === Array && opt.length === 2) {
      i = opt[0];
      j = opt[1];
    }
    if (i === undefined) {
      i = 0;
    }
    if (j === undefined) {
      j = monotype.save();
    }
    if (j && j.R) {
      R = j.R;
    }
    if (s && s.nodeType) {
      if (!R) {
        R = document.createRange();
      }
      try {
        R.setStartAfter(o);
        R.setEndBefore(s);
      } catch (e) { }
      if (R.collapsed) {
        try {
          R.setStartBefore(o);
          R.setEndAfter(s);
        } catch (e) { }
      }
      return R;
    }
    if (s && s[0] && s[0].nodeType) {
      s = s[0];
    }
    if (s && s.nodeType === 3) {
      n = s;
    }
    if (s && s.nodeType === 1) {
      n = s.lastChild || s;
    }
    if (!n) {
      n = o;
    }
    if (typeof i === 'number') {
      if (!R) {
        R = document.createRange();
      }
      try {
        R.setStart(n, i);
      } catch (e) { }
      if (typeof j === 'number') {
        try {
          R.setEnd(n, j);
        } catch (e) { }
      }
      return R;
    }
    if (typeof i === 'string') {
      if (!j) {
        j = 0;
      }
      if (typeof j === 'number') {
        if (!R) {
          R = document.createRange();
        }
        try {
          R.setStart(n, i.length);
        } catch (e) { }
        try {
          R.setEnd(n, i.length + j);
        } catch (e) { }
        return R;
      }
    }
    R = monotype.range();
    try {
      R.selectNodeContents(o);
    } catch (e) { }
    return R;
  };
  monotype.wrap = function (m: any, l: any, r: any) {
    var M: any = monotype(m);
    var L: any = l ? monotype(l) : false;
    var R: any = r ? monotype(r) : false;
    var T: any;
    if (!M || !M[0]) { return }
    if (M[0].nodeType !== 1) { return }
    T = M[0];
    if (L && L[0] && L[0].nodeType === 3) {
      if (L[0].nextSibling === T) {
        L = T;
      }
    }
    if (R && R[0] && R[0].nodeType === 3) {
      if (R[0].previousSibling === T) {
        R = T;
      }
    }
    if (L && R && L[0] === R[0]) {
      L = R = T;
    }
    if (L && L[0] && L[0].nodeType === 3) {
      if (L[0].nextSibling && L[0].nextSibling === T) {
        L = T;
      }
    }
    if (R && R[0] && R[0].nodeType === 3) {
      if (R[0].previousSibling && R[0].previousSibling === T) {
        R = T;
      }
    }
    if (L && L[0]) {
      if (L[0].nodeType === 1) {
        if (L[0] !== T) {
          L[0].parentNode.insertBefore(document.createTextNode('\u200B'), L[0].nextSibling);
        }
      }
    }
    if (R && R[0]) {
      if (R[0].nodeType === 1) {
        if (R[0] !== T) {
          R[0].parentNode.insertBefore(document.createTextNode('\u200B'), R[0]);
        }
      }
    }
    var Rng = monotype.set(L, R);
    if (!Rng) { return }
    var S = monotype.save();
    var html = T.innerHTML;
    T.innerHTML = '';
    T.appendChild(Rng.extractContents());
    var tl = T.innerHTML.length;
    if (tl) {
      var sib = T.nextSibling;
      if (!sib) {
        T.parentNode.appendChild(document.createTextNode('\u200B'));
      } else {
        T.parentNode.insertBefore(document.createTextNode('\u200B'), sib);
      }
      sib = T.previousSibling;
      if (!sib) {
        T.parentNode.insertBefore(document.createTextNode('\u200B'), T);
        sib = T.previousSibling;
      } else {
        T.parentNode.insertBefore(document.createTextNode('\u200B'), T);
      }
    }
    var text = T.textContent;
    T.innerHTML = html;
    if (S) {
      monotype.restore(S);
    }
    return text;
  };
  monotype.text = function (m: any, opt: any, s: any) {
    var _ = monotype;
    var R: any, S: any, t: any, n: any, e: any, i: any, j: any, r: any, o: any, T: any;
    if (typeof m === 'string') {
      if (typeof opt === 'string') {
        s = opt;
        opt = false;
      }
      if (typeof s === 'string') {
        s = opt;
        opt = false;
      }
      return _((m), opt, s).text();
    }
    if (!m || !m[0]) { return m || ''; }
    if (m[0].nodeType === 3) { return m[0].textContent; }
    if (m[0].nodeType !== 1) { return m.text(); }
    T = m;
    if (T.length > 1) {
      t = T[0];
      for (i = 1; i < T.length; i++) {
        t.textContent = t.textContent + T[i].textContent;
      }
      return t.textContent;
    }
    t = T[0];
    var sel = _.win.getSelection ? _.win.getSelection() : false;
    R = sel && sel.rangeCount ? sel.getRangeAt(0) : false;
    if (R && R.startContainer && R.startContainer.parentElement && R.startContainer.parentElement !== t && t.contains(R.startContainer)) {
      if (R.startContainer.parentElement.parentElement !== t) {
        R = false;
      }
    }
    if (R && R.endContainer && R.endContainer.parentElement && R.endContainer.parentElement !== t && t.contains(R.endContainer)) {
      if (R.endContainer.parentElement.parentElement !== t) {
        R = false;
      }
    }
    if (R) {
      S = _.save(T, R);
      R = S;
    }
    if (R) {
      i = R.s;
      j = R.e;
      n = R.n;
      i = i || 0;
      if (j < 0) {
        t = n.contents().length || n.text().length;
        j = t + j;
      }
      if (j === Infinity) {
        R.selectNodeContents(n[0]);
      } else {
        R.setStart(n[0], i);
        R.setEnd(e[0], j);
      }
      _.restore(R);
      m = _(m, opt);
  return monotype;
    }
  return monotype;
  };
  return monotype;
})(monotype || {});

if (typeof window !== 'undefined') {
  window.monotype = monotype;
}

export default monotype;