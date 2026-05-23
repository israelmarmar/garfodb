import { GraphNode, GunValue, PutEnvelope } from './message';

/** A chain context - internal per-chain state */
export interface ChainContext {
  $: any;
  root: any;
  back?: ChainContext;
  next?: Record<string, ChainContext>;
  get?: string;
  soul?: string;
  has?: string;
  put?: any;
  link?: string;
  lex?: any;
  tag?: Record<string, any>;
  on: (tag: string, arg?: any, as?: any) => any;
  ask?: Record<string, ChainContext>;
  any?: Record<string, (msg: any) => void>;
  echo?: Record<string, any>;
  err?: any;
  id: number;
  map?: Record<string, any>;
  one?: Record<string, any>;
  nix?: any;
  subs?: any[];
  to?: any;
  [key: string]: any;
}

/** LEX query for matching keys */
export interface LexQuery {
  '.'?: string;
  '#'?: string;
  '*'?: string;
  '='?: string;
  '>'?: string;
  '<'?: string;
  [key: string]: any;
}

/** Options for Gun constructor */
export interface GunOptions {
  peers?: string[] | Record<string, any>;
  WebSocket?: any;
  localStorage?: boolean;
  file?: string;
  uuid?: () => string;
  pid?: string;
  super?: boolean;
  faith?: boolean;
  log?: (...args: any[]) => void;
  lack?: number;
  wait?: number;
  gap?: number;
  max?: number;
  pack?: number;
  puff?: number;
  memory?: number;
  retry?: number;
  mesh?: any;
  wire?: any;
  store?: any;
  prefix?: string;
  [key: string]: any;
}

/** Chain state as seen by `.on()` callbacks */
export interface ChainState {
  put: GraphNode | undefined;
  soul?: string;
  get?: string;
  link?: string;
  [key: string]: any;
}

/** Event object for chain message handling */
export interface ChainEvent {
  put?: PutEnvelope | any;
  get?: string | any;
  $?: any;
  '@'?: string;
  '#'?: string;
  err?: string;
  ok?: any;
  seen?: any;
  via?: any;
  $$?: any;
  $$$?: any;
  VIA?: any;
  [key: string]: any;
}
