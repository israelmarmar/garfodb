/** A soul reference, the unique identifier of a graph node */
export interface Soul {
  '#': string;
}

/** State vector for a key within a node (used by HAM CRDT) */
export interface StateVector {
  '>': Record<string, number>;
}

/** Metadata on a graph node (soul + state vector) */
export interface NodeMeta extends Soul, StateVector {}

/** A value in GUN is: null | string | boolean | number | Soul */
export type GunValue = null | string | boolean | number | Soul;

/** A graph node (vertex) with metadata */
export interface GraphNode {
  _: NodeMeta;
  [key: string]: GunValue | NodeMeta | undefined;
}

/** A put envelope - writes a value to a key in a node */
export interface PutEnvelope {
  '#': string; // soul
  '.': string; // key
  ':': GunValue; // value
  '>': number; // state (HLC timestamp)
  '='?: GunValue; // alternate value field
}

/** A get request - reads data from the graph */
export interface GetEnvelope {
  '#': string; // soul
  '.'?: string; // key (optional - whole node if omitted)
}

/** A put message - batch of node updates */
export interface PutMessage {
  '#': string; // message id
  '@'?: string; // ack reference
  put: Record<string, GraphNode>;
  ok?: { '@'?: number; '/'?: number };
  _?: MessageContext;
  $?: any;
  DBG?: any;
}

/** A get message */
export interface GetMessage {
  '#': string;
  '@'?: string;
  get: GetEnvelope;
  _?: MessageContext;
  $?: any;
  DBG?: any;
}

/** An ack message */
export interface AckMessage {
  '@': string;
  '#'?: string;
  put?: Record<string, GraphNode>;
  err?: string;
  ok?: any;
  '%'?: string;
  $?: any;
  _?: MessageContext;
}

/** Internal message context (passed along the chain) */
export interface MessageContext {
  root?: any;
  $?: any;
  msg?: PutMessage;
  err?: string;
  stop?: number;
  stun?: number;
  all?: number;
  acks?: number;
  ok?: any;
  miss?: number;
  faith?: boolean;
  via?: any;
  yo?: Record<string, number>;
  raw?: string;
  hatch?: () => void;
  match?: any[];
  crack?: boolean;
  DBG?: any;
  [key: string]: any;
}

/** DAM (Decentralized Access Management) message */
export interface DamMessage {
  dam: string;
  pid?: string;
  err?: string;
  '#': string;
  '@'?: string;
  put?: any;
  get?: GetEnvelope;
  '><'?: string;
  '##'?: number;
  ok?: { '@'?: number; '/'?: number };
  _?: MessageContext;
}

/** Complete message union type */
export type GunMessage = PutMessage | GetMessage | AckMessage | DamMessage;
