import Gun from '../gun/root';

var Gun2: any = Gun;

(Gun2.chain as any).list = function(cb: any, opt: any){
	opt = opt || {};
	cb = cb || function(){}; 
	var gun = this.put({});
	gun.last = function(obj: any, cb: any){
		var last = gun.path('last');
		if(!arguments.length){ return last }
		return gun.path('last').put(null).put(obj).val(function(this: any, val: any){
			console.log("last is", val);
			last.path('next').put(this._.node, cb);
		});
	}
	gun.first = function(obj: any, cb: any){
		var first = gun.path('first');
		if(!arguments.length){ return first }
		return gun.path('first').put(null).put(obj).val(function(this: any){
			first.path('prev').put(this._.node, cb);
		});
	}
	return gun;
};

(function(){
	return;
	var Gun = require('../index');
	var gun = Gun({file: 'data.json'});
	Gun.log.verbose = true;
	
	var list = gun.list();
	list.last({name: "Mark Nadal", type: "human", age: 23}).val(function(val: any){
	});
	list.last({name: "Timber Nadal", type: "cat", age: 3}).val(function(val: any){
	});
	list.list().last({name: "Hobbes", type: "kitten", age: 4}).val(function(val: any){
	});
	list.list().last({name: "Skid", type: "kitten", age: 2}).val(function(val: any){
	});
	setTimeout(function(){ list.val(function(val: any){
		console.log("the list!", list.__.graph);
		return;
		list.path('first').val(Gun.log)
			.path('next').val(Gun.log)
			.path('next').val(Gun.log);
	})}, 1000);

	return;
	gun.list().map(function(val: any, id: any){
		console.log("each!", id, val);
	})

}());
