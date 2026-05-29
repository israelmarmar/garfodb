/* Minimal crypto polyfill for browser — never actually called at runtime
   because garfo's SEA shim uses window.crypto directly.
   Exists only to satisfy Vite/Rolldown module resolution for require('crypto')
   inside the non-taken browser fallback branch of sea/shim.js. */
const cryptoObj = globalThis.crypto || (globalThis as any).msCrypto || {};
export default cryptoObj;
export const webcrypto = cryptoObj;
export const randomBytes = (size: number): Uint8Array => {
  const bytes = new Uint8Array(size);
  (cryptoObj as any).getRandomValues?.(bytes);
  return bytes;
};
export const subtle = cryptoObj.subtle || {};
