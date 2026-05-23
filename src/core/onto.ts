// On event emitter generic javascript utility.
// Decoupled - no gun dependencies.

export interface OntoEvent {
  tag: string;
  to: { next: (arg: any) => void; back?: OntoEvent };
  last?: OntoEvent;
  back?: OntoEvent;
  on?: OntoContext;
  as?: any;
  off?: () => boolean;
  next: (arg: any) => void;
  the: OntoEvent;
  err?: any;
  [key: string]: any;
}

export interface OntoContext {
  tag?: Record<string, OntoEvent>;
  on: (tag: string, arg?: any, as?: any) => any;
  to?: { next: (arg: any) => void };
  [key: string]: any;
}

/** The base "to" object used as default next target */
const baseNext = {
  next: function (this: any, arg: any) {
    const tmp = this.to;
    if (tmp) tmp.next(arg);
  }
};

/** Create an event emitter that can be bound to a context */
export function onto(this: OntoContext, tag?: string, arg?: any, as?: any): any {
  if (!tag) {
    return { to: onto };
  }

  const isFn = typeof arg === 'function';
  const events = this.tag || (this.tag = {});
  let evt = events[tag];

  if (!evt && isFn) {
    evt = {
      tag: tag,
      to: { next: function (this: any, arg: any) {
        const tmp = this.to;
        if (tmp) tmp.next(arg);
      }},
    } as OntoEvent;
    events[tag] = evt;
  }

  if (isFn && evt) {
    const be: OntoEvent = {
      tag: tag,
      off: function (this: OntoEvent): boolean {
        const base = onto as any;
        if (this.next === base._.next) return true;
        if (this === this.the.last) {
          this.the.last = this.back;
        }
        if (this.to) {
          this.to.back = this.back;
        }
        this.next = base._.next;
        if (this.back) {
          this.back.to = this.to;
        }
        if (this.the.last === this.the) {
          if (this.on && this.on.tag) {
            delete this.on.tag[this.the.tag];
          }
        }
        return true;
      },
      to: { next: baseNext.next },
      next: arg,
      the: evt,
      on: this,
      as: as,
    };
    (be.back = evt.last || evt).to = be;
    return evt.last = be;
  }

  if (evt) {
    (evt as any) = (evt as any).to;
    if (evt && undefined !== arg) {
      (evt as any).next(arg);
    }
  }

  return evt;
}

// Add static properties to onto function
(onto as any)._ = { next: baseNext.next };
(onto as any).off = null;

/** Create a fresh OntoContext */
export function createOnto(): OntoContext {
  return {
    on: function (this: OntoContext, tag: string, arg?: any, as?: any) {
      return onto.call(this, tag, arg, as);
    }
  };
}
