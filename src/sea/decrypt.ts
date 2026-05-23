import { SEA } from './root.js';
import { api as shim } from './shim.js';
import { s as settings } from './settings.js';
import { importGen } from './aeskey.js';

export async function decrypt(data: any, pair: any, cb?: any, opt?: any): Promise<any> {
  if (cb) {
    return decrypt(data, pair, opt).then(function (result: any) {
      cb(null, result);
    }, function (err: any) {
      cb(err);
    });
  }

  opt = opt || {};
  const isWrapped = typeof data === 'string' && 'SEA{' === data.slice(0, 4);
  const parsed = isWrapped ? await shim.parse(data.slice(3)) : data;
  if (!parsed || !parsed.ct) { return; }

  const { ct, iv, s: saltB64 } = parsed;
  const subtle = shim.subtle;
  const ivBytes = shim.Buffer.from(iv, 'base64');
  const ctBytes = shim.Buffer.from(ct, 'base64');

  let key: any;
  if (pair && pair.epub) {
    key = await importGen(pair.epub, saltB64, opt);
  } else {
    const salt = saltB64 ? shim.Buffer.from(saltB64, 'base64') : 'SEA';
    key = await importGen(pair || salt, salt, opt);
  }

  try {
    const plain = await subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, ctBytes);
    const text = new TextDecoder().decode(plain);
    try { return JSON.parse(text); } catch (e) { return text; }
  } catch (e) {
    try {
      const key2 = await importGen(pair || 'SEA', 'SEA', opt);
      const plain = await subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key2, ctBytes);
      const text = new TextDecoder().decode(plain);
      try { return JSON.parse(text); } catch (e2) { return text; }
    } catch (e2) {
      return;
    }
  }
}

SEA.decrypt = decrypt;

export default decrypt;
