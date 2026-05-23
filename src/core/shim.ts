// Shim for generic javascript utilities.
// Decoupled - no imports from other gun modules.

declare function setImmediate(callback: (...args: any[]) => void, ...args: any[]): number;

/** Generate a random alphanumeric string */
export function randomString(l: number = 24, c?: string): string {
  let s = '';
  const chars = c || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz';
  let len = l;
  while (len-- > 0) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

/** Lexicographic string matching against a LEX query */
export function stringMatch(t: string, o: any): boolean {
  if (typeof t !== 'string') return false;
  if (typeof o === 'string') o = { '=': o };
  o = o || {};
  const tmp = o['='] || o['*'] || o['>'] || o['<'];
  if (t === tmp) return true;
  if (undefined !== o['=']) return false;
  const prefix = (o['*'] || o['>']);
  if (t.slice(0, (prefix || '').length) === prefix) return true;
  if (undefined !== o['*']) return false;
  if (undefined !== o['>'] && undefined !== o['<']) {
    return (t >= o['>'] && t <= o['<']);
  }
  if (undefined !== o['>'] && t >= o['>']) return true;
  if (undefined !== o['<'] && t <= o['<']) return true;
  return false;
}

/** Simple string hash (djb2 variant) */
export function stringHash(s: string, c?: number): number | undefined {
  if (typeof s !== 'string') return undefined;
  let hash = c || 0;
  if (!s.length) return hash;
  for (let i = 0, l = s.length; i < l; ++i) {
    const n = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + n;
    hash |= 0;
  }
  return hash;
}

/** Check if a value is a plain object */
export function isPlainObject(o: any): boolean {
  return o
    ? (o instanceof Object && o.constructor === Object) ||
        Object.prototype.toString.call(o).match(/^\[object (\w+)\]$/)![1] === 'Object'
    : false;
}

/** Check if an object is empty (optionally ignoring certain keys) */
export function isEmptyObject(o: any, ignore?: string[]): boolean {
  const has = Object.prototype.hasOwnProperty;
  for (const k in o) {
    if (has.call(o, k) && (!ignore || ignore.indexOf(k) === -1)) {
      return false;
    }
  }
  return true;
}

/** Get own keys of an object */
export function getKeys(o: any): string[] {
  if (typeof o !== 'object' && typeof o !== 'function') return [];
  return Object.keys(o);
}

/** Create a poll function with CPU scheduling */
export function createPoll(): (fn: () => void) => void {
  let last = 0;
  let count = 0;

  const hasImmediate = typeof setImmediate !== 'undefined';
  const hasMessageChannel = typeof MessageChannel !== 'undefined';

  const sI: (cb: () => void) => void =
    (hasImmediate ? setImmediate : null) ||
    (hasMessageChannel
      ? (() => {
          const c = new MessageChannel();
          let fn: () => void = () => {};
          c.port1.onmessage = () => { fn(); };
          return (q: () => void) => { fn = q; c.port2.postMessage(''); };
        })()
      : setTimeout);

  const perf = (typeof performance !== 'undefined' ? performance : null);
  const check = perf || { now: () => +new Date() };

  return function poll(fn: () => void) {
    if ((9 >= (check.now() - last)) && count++ < 3333) {
      fn();
      return;
    }
    sI(() => {
      last = check.now();
      fn();
    });
    count = 0;
  };
}

/** Turn-based scheduling - threads callbacks in turns */
export function createTurn(pollFn: (fn: () => void) => void): (fn: () => void) => void {
  const queue: (() => void)[] = [];
  let i = 0;

  function process() {
    const fn = queue[i++];
    if (fn) fn();
    if (i === queue.length || i === 99) {
      queue.splice(0, i);
      i = 0;
    }
    if (queue.length) {
      pollFn(process);
    }
  }

  return function turn(fn: () => void) {
    if (queue.push(fn) === 1) {
      pollFn(process);
    }
  };
}

/** Process items in batches via a turn function */
export function eachBatch<T>(
  items: T[],
  fn: (item: T) => any | undefined,
  done?: (result?: any) => void,
  batchSize: number = 9,
  turnFn?: (fn: () => void) => void
): void {
  const t = turnFn || ((f: () => void) => setTimeout(f, 0));
  const list = items.slice();

  function process() {
    const batch = list.splice(0, batchSize);
    if (batch.length) {
      for (let i = 0; i < batch.length; i++) {
        const r = fn(batch[i]);
        if (undefined !== r) {
          done && done(r);
          return;
        }
      }
      t(process);
      return;
    }
    done && done();
  }
  process();
}

/** Apply shim polyfills to globals (String, Object, setTimeout) */
export function applyShim(): void {
  if (!(String as any).random) {
    (String as any).random = randomString;
  }
  if (!(String as any).match) {
    (String as any).match = stringMatch;
  }
  if (!(String as any).hash) {
    (String as any).hash = stringHash;
  }
  if (!(Object as any).plain) {
    (Object as any).plain = isPlainObject;
  }
  if (!(Object as any).empty) {
    (Object as any).empty = isEmptyObject;
  }
  if (!(Object as any).keys) {
    (Object as any).keys = getKeys;
  }
}
