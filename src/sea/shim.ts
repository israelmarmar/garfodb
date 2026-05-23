declare var require: (name: string, opt?: any) => any;

import { SEA } from './root.js';
import { SafeBuffer } from './buffer.js';

const u = undefined;

(JSON as any).parseAsync = (JSON as any).parseAsync ||
  function (t: string, cb: any, r?: any) {
    try { cb(u, JSON.parse(t, r)); } catch (e) { cb(e); }
  };

(JSON as any).stringifyAsync = (JSON as any).stringifyAsync ||
  function (v: any, cb: any, r?: any, s?: any) {
    try { cb(u, JSON.stringify(v, r, s)); } catch (e) { cb(e); }
  };

export const api: any = {
  Buffer: SafeBuffer,
  parse: function (t: string, r?: any): Promise<any> {
    return new Promise(function (res, rej) {
      (JSON as any).parseAsync(t, function (err: any, raw: any) {
        err ? rej(err) : res(raw);
      }, r);
    });
  },
  stringify: function (v: any, r?: any, s?: any): Promise<string> {
    return new Promise(function (res, rej) {
      (JSON as any).stringifyAsync(v, function (err: any, raw: string) {
        err ? rej(err) : res(raw);
      }, r, s);
    });
  },
  TextEncoder: typeof TextEncoder !== 'undefined' ? TextEncoder : undefined,
  TextDecoder: typeof TextDecoder !== 'undefined' ? TextDecoder : undefined,
};

const win: any = SEA.window;

if (win) {
  const cryptoObj = win.crypto || win.msCrypto;
  api.crypto = cryptoObj;
  api.subtle = (cryptoObj || {}).subtle || (cryptoObj || {}).webkitSubtle;
  api.TextEncoder = win.TextEncoder;
  api.TextDecoder = win.TextDecoder;
  api.random = (len: number) => SafeBuffer.from(
    cryptoObj.getRandomValues(new Uint8Array(SafeBuffer.alloc(len)))
  );
}

if (!api.TextDecoder) {
  try {
    const { TextEncoder: TE, TextDecoder: TD } = require('text-encoding');
    api.TextDecoder = TD;
    api.TextEncoder = TE;
  } catch (e) { /* ignore */ }
}

if (!api.crypto) {
  try {
    const cryptoMod = require('crypto');
    Object.assign(api, {
      crypto: cryptoMod,
      random: (len: number) => SafeBuffer.from(cryptoMod.randomBytes(len)),
    });
    const { Crypto: WebCrypto } = require('@peculiar/webcrypto');
    api.ossl = api.subtle = new WebCrypto({ directory: 'ossl' }).subtle;
  } catch (e) {
    console.log("Please `npm install @peculiar/webcrypto` or add it to your package.json !");
  }
}

export default api;
