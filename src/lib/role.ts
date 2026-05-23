declare var require: any;
declare var gun: any;
import { Gun } from '../gun/root.js';

;(function(){

	function resolve(chain?: any){
		(Gun as any).debug=1;
		chain = chain || gun.get('a').get('b').map().map().get('c').get('d').get(function(a: any, b: any, c: any, tmp: any){
			a.ID = a.ID || (Gun as any).text.random(2);
			console.log('********', a.put || a);
		});
		console.log("~~~~~~~~~~~~~~");
		(window as any).chain = chain;
	}

	function off(chain: any){
		chain = chain || gun.get('users').map().get(function(a: any, b: any, c: any, tmp: any){
			console.log("***", a.put);
			b.rid(a);
		});
		gun.get('users').get('alice').get(function(a: any, b: any){
			console.log(">>>", a.put);
		});
		console.log("vvvvvvvvvvvvv");
		(window as any).chain = chain;
	}

	function soul(chain: any){
		(Gun as any).debug = 1;
		gun.get('x').get('y').get('z').get('q').get(function(a: any, b: any, c: any){
			console.log("***", a.put || a);
		});
		setTimeout(function(){
			(console.debug as any).j=1;
			(console.debug as any).i=1;console.log("------------");
			gun.get('x').get('y').put({
				z: {
					q: {r: {hello: 'world'}}
				}
			});
		},20);
		console.log("..............");
		(window as any).chain = chain;
	}

	(window as any).resolve = resolve;
	(window as any).off = off;
	(window as any).soul = soul;
	setTimeout(function(){ resolve() },1);

  function Role(){}
  if(typeof window !== "undefined"){ (Role as any).window = window }
	(Gun as any).SEA || require('../sea');
	if(!(Gun as any).User){ throw "No User System!" }
	var User = (Gun as any).User;

	User.prototype.trust = function(user: any){

	}

}());
