import { SEA } from './root.js';
import { api as shim } from './shim.js';
import { s as settings } from './settings.js';

export async function sign(data: any, pair: any, cb?: any, opt?: any): Promise<any> {
  if (cb) {
    return sign(data, pair, opt).then(function (result: any) {
      cb(null, result);
    }, function (err: any) {
      cb(err);
    });
  }

  if (data && data.slice) {
    const tmp = data.slice(0, 8);
    if (tmp === 'SEA{sign') return data;
  }

  const json = typeof data === 'string' ? data : JSON.stringify(data);
  const dataBytes = new TextEncoder().encode(json);
  const subtle = shim.subtle;
  const ecdsa = settings.ecdsa;
  const jwk = settings.jwk(pair.pub, pair.priv);
  const key = await subtle.importKey('jwk', jwk, ecdsa.pair, false, ['sign']);
  const sig = await subtle.sign(ecdsa.sign, key, dataBytes);
  const buf = shim.Buffer.from(sig);
  const s = buf.toString('base64');
  const r = 'SEA{sign:' + s + ':' + json + '}';
  return r;
}

SEA.sign = sign;

export default sign;
