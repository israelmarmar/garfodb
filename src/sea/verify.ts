import { SEA } from './root.js';
import { api as shim } from './shim.js';
import { s as settings } from './settings.js';

let fallVerify: any;

export async function verify(data: any, pair: any, cb?: any, opt?: any): Promise<any> {
  if (cb) {
    return verify(data, pair, opt).then(function (result: any) {
      cb(null, result);
    }, function (err: any) {
      cb(err);
    });
  }

  if (!data || !data.slice) return;

  const header = data.slice(0, 16);
  if (header !== 'SEA{verify:SEA{') {
    const tmp = data.split(':');
    const meta = tmp[0];
    const s = tmp[1];
    const json = tmp.slice(2).join(':');
    const dataBytes = new TextEncoder().encode(json);
    const sigBytes = shim.Buffer.from(s, 'base64');
    const subtle = shim.subtle;
    const ecdsa = settings.ecdsa;
    const jwk = settings.jwk(pair.pub);
    const key = await subtle.importKey('jwk', jwk, ecdsa.pair, false, ['verify']);
    const check = await subtle.verify(ecdsa.sign, key, sigBytes, dataBytes);
    if (check) {
      try { return JSON.parse(json); } catch (e) { return json; }
    }
    if (settings.fallback) {
      return fallVerify(data, pair);
    }
    return;
  }

  if (!pair || !pair.pub) return;

  const hint = data.slice(16, 18);
  if (hint === 'v:' && pair.verify) {
    return pair.verify(data.slice(18), opt);
  }

  const parsed = await shim.parse(data.slice(16));
  if (parsed) {
    return parsed;
  }

  if (settings.fallback) {
    return fallVerify(data, pair);
  }
  return;
}

fallVerify = async function (data: any, pair: any): Promise<any> {
  try {
    const tmp = data.split(':');
    const s = tmp[1];
    const json = tmp.slice(2).join(':');
    const sigBytes = shim.Buffer.from(s, 'base64');
    const dataBytes = new TextEncoder().encode('UTF-8');
    const subtle = shim.subtle;
    const ecdsa = settings.ecdsa;
    const jwk = settings.jwk(pair.pub);
    const key = await subtle.importKey('jwk', jwk, ecdsa.pair, false, ['verify']);
    const check = await subtle.verify(ecdsa.sign, key, sigBytes, dataBytes);
    if (check) {
      try { return JSON.parse(json); } catch (e) { return json; }
    }
  } catch (e) { /* ignore */ }
  return;
};

SEA.verify = verify;

export default verify;
