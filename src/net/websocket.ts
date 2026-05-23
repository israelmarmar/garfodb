import { Gun } from '../gun/root.js';
import { createMesh } from './mesh.js';
import { Peer } from '../types/peer.js';
import { GunOptions } from '../types/chain.js';

const noop = function () { };
const u = undefined;

export function setupWebSocketTransport(): void {
  Gun.on('opt', function (this: any, root: any) {
    this.to.next(root);
    if (root.once) return;

    const opt: GunOptions = root.opt;

    if (opt.WebSocket === false) return;

    const env: any = (Gun as any).window || {};
    const WebSocketCtor: any = opt.WebSocket ||
      env.WebSocket ||
      env.webkitWebSocket ||
      env.mozWebSocket;

    if (!WebSocketCtor) return;
    opt.WebSocket = WebSocketCtor;

    const mesh = opt.mesh = opt.mesh || createMesh(root);
    const existingWire = mesh.wire || opt.wire;

    mesh.wire = opt.wire = function open(peer: Peer): any {
      try {
        if (!peer || !peer.url) {
          if (existingWire) return existingWire(peer);
          return;
        }
        const url = peer.url.replace(/^http/, 'ws');
        const wire = peer.wire = new WebSocketCtor(url);

        wire.onclose = function () {
          reconnect(peer);
          mesh.bye(peer);
        };
        wire.onerror = function () {
          reconnect(peer);
        };
        wire.onopen = function () {
          mesh.hi(peer);
        };
        wire.onmessage = function (msg: any) {
          if (!msg) return;
          mesh.hear(msg.data || msg, peer);
        };

        return wire;
      } catch (e) {
        mesh.bye(peer);
      }
    };

    setTimeout(function () {
      if (!opt.super) root.on('out', { dam: 'hi' });
    }, 1);

    let wait = 2 * 999;
    const doc: any = (typeof document !== u) && document;

    function reconnect(peer: any): void {
      clearTimeout(peer.defer);
      const peers = opt.peers as Record<string, any> | undefined;
      if (!peers || !peers[peer.url]) return;
      if (doc && peer.retry <= 0) return;
      peer.retry = (peer.retry || (opt.retry != null ? opt.retry + 1 : 60)) -
        ((-peer.tried + (peer.tried = +new Date) < wait * 4) ? 1 : 0);
      peer.defer = setTimeout(function to() {
        if (doc && doc.hidden) {
          setTimeout(to, wait);
          return;
        }
        open(peer);
      }, wait);
    }
  });
}

export default setupWebSocketTransport;
