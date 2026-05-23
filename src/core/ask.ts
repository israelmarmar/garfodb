import { randomString } from './shim.js';
import { OntoContext } from './onto.js';

// Request / response module, for asking and acking messages.
// Depends on an onto (event emitter) context.

export interface AskOptions {
  lack?: number;
}

/**
 * Create an ask (request/response) function bound to an event context.
 */
export function createAsk(onCtx: OntoContext, opt?: AskOptions) {
  const options = opt || {};
  const lack = options.lack || 9000;

  return function ask(cb: any, as?: any): any {
    if (!onCtx.on) return;
    if (typeof cb !== 'function') {
      if (!cb) return;
      const id = cb['#'] || cb;
      const tmp = (onCtx.tag || {})[id as string];
      if (!tmp) return;
      if (as) {
        const evt = onCtx.on(id, as);
        clearTimeout(evt.err);
        evt.err = setTimeout(() => evt.off(), lack);
      }
      return true;
    }

    const id = (as && as['#']) || randomString(9);
    if (!cb) return id;

    const listener = onCtx.on(id, cb as any, as);
    listener.err = listener.err || setTimeout(() => {
      listener.off();
      listener.next({ err: 'Error: No ACK yet.', lack: true });
    }, lack);
    return id;
  };
}
