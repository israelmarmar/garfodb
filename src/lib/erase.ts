import { Gun } from '../gun/root.js';

(Gun as any).on('opt', function(this: any, root: any) {
  this.to.next(root);
  if (root.once) { return }
  root.on('put', function(this: any, msg: any) {
    (Gun as any).graph.is(msg.put, null, function(val: any, key: any, node: any, soul: any) {
      if (null !== val) { return }
      let tmp = root.graph[soul];
      if (tmp) {
        delete tmp[key];
      }
      tmp = tmp && tmp._ && tmp._['>'];
      if (tmp) {
        delete tmp[key];
      }
      tmp = root.next;
      if (tmp && (tmp = tmp[soul]) && (tmp = tmp.put)) {
        delete tmp[key];
        tmp = tmp._ && tmp._['>'];
        if (tmp) {
          delete tmp[key];
        }
      }
    });
    this.to.next(msg);
  });
});
