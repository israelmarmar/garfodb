import { SEA } from './root.js';
import { api as shim } from './shim.js';
import { s as settings } from './settings.js';
import { importGen } from './aeskey.js';

export async function encrypt(data: any, pair: any, cb?: any, opt?: any): Promise<any> {
  if (cb) {
    return encrypt(data, pair, opt).then(function (result: any) {
      cb(null, result);
    }, function (err: any) {
      cb(err);
    });
  }

  opt = opt || {};
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  const dataBytes = new TextEncoder().encode(json);
  const subtle = shim.subtle;

  let key: any;
  let iv: Uint8Array;
  const salt = pair;

  if (pair && pair.epub) {
    const pub = pair.epub;
    key = await importGen(pub, salt, opt);
    iv = shim.crypto.getRandomValues(new Uint8Array(12));
  } else {
    key = await importGen(salt || 'SEA', salt, opt);
    iv = shim.crypto.getRandomValues(new Uint8Array(12));
  }

  const cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, key, dataBytes);
  const ct = shim.Buffer.from(cipher).toString('base64');
  const ivB64 = shim.Buffer.from(iv).toString('base64');

  let result: any = { ct, iv: ivB64, s: shim.Buffer.from(salt || 'SEA').toString('base64') };
  const str = JSON.stringify(result);
  if (opt.wrap !== false) {
    result = 'SEA{' + str + '}';
  }
  return result;
}

SEA.encrypt = encrypt;

export default encrypt;
