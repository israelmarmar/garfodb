import { GraphNode } from '../types/message';

// GUN's Hybrid Logical Clock (HLC) for HAM CRDT conflict resolution.
// Each write gets a monotonically increasing timestamp.
// If multiple writes happen within the same millisecond, we use a
// counter to disambiguate.

const NEG_INF = -Infinity;
let counter = 0;
let lastTime = NEG_INF;
const MAX_D = 999; // sub-millisecond resolution

/**
 * GUN state (HLC timestamp) factory.
 * Returns a monotonically increasing number that combines
 * wall-clock time with a logical counter.
 */
export function createState(drift: number = 0): number {
  const now = +new Date();
  if (lastTime < now) {
    counter = 0;
    lastTime = now + drift;
    return lastTime;
  }
  lastTime = now + (++counter / MAX_D) + drift;
  return lastTime;
}

createState.drift = 0;

/**
 * Get the state value for a key on a node.
 * Third parameter `fallback` is used as the state object instead if node is missing its state vector.
 */
export function getState(node: GraphNode, key: string, fallback?: any): number {
  const meta = (key && node && node._ && node._['>']) || fallback;
  if (!meta) return NEG_INF;
  const val = meta[key];
  return (typeof val === 'number') ? val : NEG_INF;
}

/**
 * Set the state value for a key on a node.
 * Returns the modified node.
 */
export function setState(
  node: any,
  key: string,
  state: number,
  value?: any,
  soul?: string
): any {
  const n = node || {} as GraphNode;
  n._ = n._ || {} as any;
  if (soul) n._['#'] = soul;
  const states = n._['>'] || (n._['>'] = {});
  if (key !== '_' && key !== undefined) {
    if (typeof state === 'number') {
      states[key] = state;
    }
    if (value !== undefined) {
      (n as any)[key] = value;
    }
  }
  return n;
}

/**
 * Copy state from one node to another on a specific key.
 */
export function copyState(
  target: GraphNode,
  key: string,
  source: GraphNode,
  value: any,
  soul: string
): GraphNode {
  return setState(target, key, getState(source, key), value, soul);
}
