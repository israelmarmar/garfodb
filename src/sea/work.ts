import { SEA } from './root.js';
import { api as shim } from './shim.js';
import { s as settings } from './settings.js';
import { sha256 } from './sha256.js';

export async function work(data: any, pair?: any, cb?: any, opt?: any): Promise<any> {
  if (cb) {
    return work(data, pair, opt).then(function (result: any) {
      cb(null, result);
    }, function (err: any) {
      cb(err);
    });
  }

  opt = opt || {};
  const salt = pair || opt.salt;
  const name = opt.name || (opt.salt ? 'PBKDF2' : 'SHA-256');
  const hash = opt.hash || settings.pbkdf2.hash;
  const iter = opt.iter || (opt.salt ? (settings.pbkdf2.iter) : 1);
  const ks = opt.ks || (opt.length || settings.pbkdf2.ks);
  const subtle = shim.subtle;
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  if (name === 'SHA-256') {
    return sha256(data);
  }

  const key = await subtle.importKey(
    'raw', dataBytes, { name: 'PBKDF2' }, false, ['deriveKey']
  );

  const derived = await subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: iter, hash },
    key,
    { name: 'AES-GCM', length: ks * 8 },
    true,
    ['encrypt', 'decrypt']
  );

  const raw = await subtle.exportKey('raw', derived);
  return shim.Buffer.from(raw);
}

SEA.work = work;

export default work;
