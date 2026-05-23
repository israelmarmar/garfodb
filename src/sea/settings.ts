import { SEA } from './root.js';
import { api as shim } from './shim.js';

export const s: any = {};

s.pbkdf2 = { hash: { name: 'SHA-256' }, iter: 100000, ks: 64 };
s.ecdsa = {
  pair: { name: 'ECDSA', namedCurve: 'P-256' },
  sign: { name: 'ECDSA', hash: { name: 'SHA-256' } },
};
s.ecdh = { name: 'ECDH', namedCurve: 'P-256' };

s.jwk = function (pub: string, d?: string): any {
  const parts = pub.split('.');
  const x = parts[0];
  const y = parts[1];
  const jwk: any = { kty: 'EC', crv: 'P-256', x, y, ext: true };
  jwk.key_ops = d ? ['sign'] : ['verify'];
  if (d) jwk.d = d;
  return jwk;
};

s.keyToJwk = function (keyBytes: any): any {
  const keyB64 = keyBytes.toString('base64');
  const k = keyB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
  return { kty: 'oct', k, ext: false, alg: 'A256GCM' };
};

s.recall = {
  validity: 12 * 60 * 60,
  hook: function (props: any) { return props; },
};

s.check = function (t: any): boolean {
  return (typeof t === 'string') && ('SEA{' === t.slice(0, 4));
};

s.parse = async function p(t: any): Promise<any> {
  try {
    const yes = (typeof t === 'string');
    if (yes && 'SEA{' === t.slice(0, 4)) { t = t.slice(3); }
    return yes ? await shim.parse(t) : t;
  } catch (e) { /* ignore */ }
  return t;
};

SEA.opt = s;

export default s;
