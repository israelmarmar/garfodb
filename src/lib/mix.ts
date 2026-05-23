import Gun from '../gun/root';

;(function(){
	(Gun as any).state.node = function(node: any, vertex: any, opt: any){
		opt = opt || {};
		opt.state = opt.state || (Gun as any).state();
		var now = (Gun as any).obj.copy(vertex);
		(Gun as any).node.is(node, function(val: any, key: any){
			var ham = (Gun as any).HAM(opt.state, (Gun as any).state.is(node, key), (Gun as any).state.is(vertex, key), val, vertex[key]);
			if(!ham.incoming){
				return;
			}
			now = (Gun as any).state.to(node, key, now);
		});
		return now;
	}
}());
