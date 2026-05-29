import { Gun } from './gun/index.js';
import { setupNostrTransport as _setupNostrTransport } from './nostr/index.js';

export * from './types/index.js';
export * from './core/index.js';

export { Gun };
export { default } from './gun/index.js';
export const Garfo = Gun;

import './net/websocket.js';
import './net/localStorage.js';

import './lib/index.js';

import './sea/index.js';

export const setupNostrTransport = _setupNostrTransport;
import './nostr/index.js';
