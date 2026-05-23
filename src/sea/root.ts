export const SEA: any = {};

const win: any =
  typeof self !== 'undefined' ? self :
  typeof window !== 'undefined' ? window :
  typeof globalThis !== 'undefined' ? globalThis :
  {};

SEA.window = win;
if (win) { win.SEA = SEA; }

export default SEA;
