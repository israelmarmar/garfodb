declare var require: any;
import Gun from '../gun/root.js';

(Gun.chain as any).open || require('./open');

(Gun.chain as any).later = function(cb: any, age: any){
  var gun = this;
  age = age * 1000;
  setTimeout(function(){
    gun.open(cb, {off: true});
  }, age);
  return gun;
}
