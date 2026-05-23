import { SEA } from './root.js';
import { api as shim } from './shim.js';
import { s as settings } from './settings.js';

export async function secret(key: any, pair: any, cb?: any, opt?: any): Promise<any> {
  if (cb) {
    return secret(key, pair, opt).then(function (result: any) {
      cb(null, result);
    }, function (err: any) {
      cb(err);
    });
  }

  opt = opt || {};
  const subtle = shim.subtle;

  async function keysToEcdhJwk(pub: string, d?: string): Promise<any> {
    const pubParts = pub.split('.');
    const jwk: any = {
      kty: 'EC',
      crv: 'P-256',
      x: pubParts[0],
      y: pubParts[1],
      ext: true,
    };
    jwk.key_ops = d ? ['deriveKey', 'deriveBits'] : [];
    if (d) jwk.d = d;
    return jwk;
  }

  const pubJwk = await keysToEcdhJwk(key);
  const pubKey = await subtle.importKey('jwk', pubJwk, settings.ecdh, true, []);

  const privJwk = await keysToEcdhJwk(pair.epub, pair.epriv);
  const privKey = await subtle.importKey('jwk', privJwk, settings.ecdh, false, ['deriveBits']);

  const bits = await subtle.deriveBits(
    { name: 'ECDH', public: pubKey },
    privKey,
    256
  );

  return shim.Buffer.from(bits);
}

SEA.secret = secret;

export default secret;
