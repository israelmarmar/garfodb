import { Gun } from '../gun/root.js';

(Gun.chain as any).load = function load(this: Gun, cb?: any, opt?: any, at?: any): Gun {
  (opt = opt || {}).off = true;
  return (this as any).open(cb, opt, at);
};
