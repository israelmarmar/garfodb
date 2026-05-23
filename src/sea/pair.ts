import { SEA } from './root.js';
import { api as shim } from './shim.js';
import { s as settings } from './settings.js';

export async function pair(cb?: any, opt?: any): Promise<any> {
  if (cb) {
    return pair(opt).then(function (result: any) {
      cb(null, result);
    }, function (err: any) {
      cb(err);
    });
  }

  opt = opt || {};
  const subtle = shim.subtle;

  const ecdsaKeys = await subtle.generateKey(settings.ecdsa.pair, true, ['sign', 'verify']);
  const ecdhKeys = await subtle.generateKey(settings.ecdh, true, ['deriveKey', 'deriveBits']);

  const ecdsaPub = await subtle.exportKey('jwk', ecdsaKeys.publicKey);
  const ecdsaPriv = await subtle.exportKey('jwk', ecdsaKeys.privateKey);
  const ecdhPub = await subtle.exportKey('jwk', ecdhKeys.publicKey);
  const ecdhPriv = await subtle.exportKey('jwk', ecdhKeys.privateKey);

  const result: any = {
    pub: ecdsaPub.x + '.' + ecdsaPub.y,
    priv: ecdsaPriv.d,
    epub: ecdhPub.x + '.' + ecdhPub.y,
    epriv: ecdhPriv.d,
  };

  return result;
}

export async function name(cb?: any, opt?: any): Promise<any> {
  return pair(cb, opt);
}

SEA.pair = pair;
SEA.name = name;

export default pair;
