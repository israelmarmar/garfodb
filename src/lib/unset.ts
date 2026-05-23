import { Gun } from '../gun/root.js';

const rel_ = '#';
const node_ = '_';

(Gun.chain as any).unset = function (node?: any): any {
  if (this && node && node[node_] && node[node_].put && node[node_].put[node_] && node[node_].put[node_][rel_]) {
    this.put({ [node[node_].put[node_][rel_]]: null });
  }
  return this;
};
