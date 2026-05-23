import { api as shim } from './shim.js';
import { s as settings } from './settings.js';
import { sha256 } from './sha256.js';

export async function importGen(key: any, salt: any, opt?: any): Promise<any> {
  opt = opt || {};
  const hash = opt.hash || 'SHA-256';
  const iter = opt.iter || settings.pbkdf2.iter;
  const ks = opt.ks || settings.pbkdf2.ks;
  const subtle = shim.subtle;

  const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const saltBytes = typeof salt === 'string' ? new TextEncoder().encode(salt) : salt;

  const baseKey = await subtle.importKey(
    'raw', keyBytes, { name: 'PBKDF2' }, false, ['deriveKey']
  );

  const aesKey = await subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: iter, hash: { name: hash } },
    baseKey,
    { name: 'AES-GCM', length: ks * 8 },
    false,
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

export default importGen;
