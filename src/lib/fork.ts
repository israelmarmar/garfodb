import Gun from '../gun/root.js';

(Gun.chain as any).fork = function(g: any) {
    var gun = this._;
    var w: any = {},
        mesh = () => {
            var root = gun.root,
                opt = root.opt;
            return opt.mesh || (Gun as any).Mesh(root);
        }
    w.link = function() {
        if (this._l) return this._l;
        this._l = {
            send: (msg: any) => {
                if (!this.l || !this.l.onmessage)
                    throw 'not attached';
                this.l.onmessage(msg);
            }
        }
        return this._l;
    };
    w.attach = function(l: any) {
        if (this.l)
            throw 'already attached';
        var peer = { wire: l };
        l.onmessage = function(msg: any) {
            mesh().hear(msg.data || msg, peer);
        };
        mesh().hi(this.l = l && peer);
    };
    w.wire = function(opts: any) {
        var f = new (Gun as any)(opts);
        f.fork(w);
        return f;
    };
    if (g) {
        w.attach(g.link());
        g.attach(w.link());
    }
    return w;
};
