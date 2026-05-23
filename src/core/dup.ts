import { eachBatch } from './shim';

// Duplicate detection module.
// Tracks message IDs to prevent processing the same message twice.

export interface DupOptions {
  max?: number;
  age?: number;
}

export interface DupEntry {
  was: number;
  '#'?: string;
  via?: any;
  it?: any;
}

export interface DupInstance {
  s: Record<string, DupEntry>;
  check: (id: string) => boolean;
  track: (id: string) => DupEntry;
  drop: (age?: number) => void;
  now: number;
  to?: any;
}

/**
 * Create a duplicate detection system.
 */
export function createDup(opt?: DupOptions): DupInstance {
  const dup: DupInstance = { s: {}, now: 0 } as any;

  const options = opt || { max: 999, age: 1000 * 9 };

  dup.check = function check(id: string): boolean {
    if (!dup.s[id]) return false;
    return track(id) !== undefined;
  };

  const track = dup.track = function track(id: string): DupEntry {
    let entry = dup.s[id];
    if (!entry) {
      entry = {} as DupEntry;
      dup.s[id] = entry;
    }
    entry.was = dup.now = +new Date();
    if (!dup.to) {
      dup.to = setTimeout(() => dup.drop(), options.age! + 9);
    }
    return entry;
  };

  dup.drop = function drop(age?: number): void {
    dup.to = null;
    dup.now = +new Date();
    const keys = Object.keys(dup.s);

    eachBatch(keys, (id: string) => {
      const entry = dup.s[id];
      if (entry && (age || options.age!) > (dup.now - entry.was)) {
        return;
      }
      delete dup.s[id];
    }, undefined, 99);
  };

  return dup;
}
