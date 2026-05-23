import { Gun } from '../gun/root.js';

const u = undefined;

(Gun.chain as any).not = function not(this: Gun, cb?: any, opt?: any): Gun {
  return this.get(ought, { not: cb });
};

function ought(this: any, at: any, ev: any): void {
  ev.off();
  if (at.err || (u !== at.put)) return;
  if (!this.not) return;
  this.not.call(at.gun, at.get, function () {
    console.log("Please report this bug on https://gitter.im/amark/gun and in the issues.");
  });
}
