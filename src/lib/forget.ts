import Gun from '../gun/root.js';

(Gun as any).on('opt', function(this: any, root: any){
    once(root);
    this.to.next(root);
});

function once(root: any){
    if(root.once){ return }
    var forget = root.opt.forget = root.opt.forget || {};
    root.on('put', function(this: any, msg: any){
        (Gun as any).graph.is(msg.put, function(node: any, soul: string){
            if(!(Gun as any).obj.has(forget, soul)){ return }
            delete msg.put[soul];
        });
        this.to.next(msg);
    });
}
