declare var window: any;

function Nomem() {
  const opt: any = {}, u: any = undefined;
  opt.put = function(file: any, data: any, cb: any) { cb(null, -9) };
  opt.get = function(file: any, cb: any) { cb(null) };
  return opt;
}
if (typeof window !== "undefined") {
  (window as any).Nomem = Nomem;
} else {
  try { (module as any).exports = Nomem } catch (e) {}
}
