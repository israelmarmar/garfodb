// Global type augmentations for GUN's runtime extensions

/* eslint-disable @typescript-eslint/no-unused-vars */

// Augment setTimeout with GUN's custom properties
interface SetTimeout {
  (handler: TimerHandler, timeout?: number, ...args: any[]): number;
  hold?: number;
  poll?: (fn: () => void) => void;
  turn?: (fn: () => void) => void;
  each?: <T>(
    items: T[],
    fn: (item: T) => any | undefined,
    done?: (result?: any) => void,
    batchSize?: number
  ) => void;
  Book?: any;
}

interface ObjectConstructor {
  plain(o: any): boolean;
  empty(o: any, n?: string[]): boolean;
  keys(o: any): string[];
}

interface StringConstructor {
  random(l?: number, c?: string): string;
  match(t: string, o: any): boolean;
  hash(s: string, c?: number): number | undefined;
}
