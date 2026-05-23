if (typeof globalThis.btoa === 'undefined') {
  (globalThis as any).btoa = function (str: string): string {
    return (globalThis as any).Buffer
      ? (globalThis as any).Buffer.from(str, 'binary').toString('base64')
      : btoa(str);
  };
}
if (typeof globalThis.atob === 'undefined') {
  (globalThis as any).atob = function (b64: string): string {
    return (globalThis as any).Buffer
      ? (globalThis as any).Buffer.from(b64, 'base64').toString('binary')
      : atob(b64);
  };
}

export {};
