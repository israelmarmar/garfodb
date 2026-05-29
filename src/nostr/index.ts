import { Gun } from '../gun/root.js';

// Use a regular event kind so relays store every GUN transport packet.
// Kinds 30000-39999 are addressable/replaceable and may drop or reject
// packets without a `d` tag, which breaks message delivery.
const DEFAULT_GUN_KIND = 9111;
const GUN_TAG = 'gun-db';

const DEFAULT_RELAYS: string[] = [
  'wss://relay.damus.io',
  'wss://nos.lol',
];

let ntMod: any = null;

function ensureNt(): any {
  if (ntMod) return ntMod;
  return null;
}

async function loadNt(): Promise<any> {
  try {
    const mod = await import('nostr-tools');
    const pure = await import('nostr-tools/pure');
    ntMod = { ...mod, ...pure };
    return ntMod;
  } catch (e) {
    return null;
  }
}

let loadingNt: Promise<any> | null = null;

function getNt(): Promise<any> {
  if (ntMod) return Promise.resolve(ntMod);
  if (!loadingNt) loadingNt = loadNt();
  return loadingNt;
}

export function setupNostrTransport(): void {
  Gun.on('opt', function (this: any, root: any) {
    this.to.next(root);
    if (root.once) return;
    const opt = root.opt;
    if (opt.nostr === false) return;

    getNt().then((nt) => {
      if (!nt) {
        Gun.log('garfo: nostr-tools not available, Nostr transport disabled');
        return;
      }

      const { SimplePool } = nt;
      const { finalizeEvent, generateSecretKey, getPublicKey } = nt;

      let pool: any;
      let sk: Uint8Array;
      let pk: string;
      let relayUrls: string[] = [];
      const gunKind = Number(opt.nostr?.kind || DEFAULT_GUN_KIND);

      sk = opt.nostr?.sk
        ? typeof opt.nostr.sk === 'string'
          ? hexToBytes(opt.nostr.sk)
          : opt.nostr.sk
        : generateSecretKey();
      pk = getPublicKey(sk);

      if (opt.nostr?.relays) {
        relayUrls.push(...opt.nostr.relays);
      } else if (opt.peers) {
        Object.keys(opt.peers).forEach((url: string) => {
          if (url.startsWith('wss://') || url.startsWith('ws://')) {
            relayUrls.push(url);
          }
        });
      }

      if (relayUrls.length === 0) {
        relayUrls.push(...DEFAULT_RELAYS);
        Gun.log('garfo: using default Nostr relays: ' + DEFAULT_RELAYS.join(', '));
      }

      pool = new SimplePool(/* { maxWaitForConnection: 3000 } */);

      const mesh = opt.mesh || createNostrMesh(root);
      opt.mesh = mesh;

      opt.wire = function wireNostr(peer: any): any {
        if (!peer || !peer.url) return;
        pool.ensureRelay(peer.url).catch(() => { });
        return peer;
      };

      const gunFilter: any = {
        kinds: [gunKind],
        '#g': [GUN_TAG],
        limit: opt.nostr?.limit || 500,
      };

      pool.subscribeMany(relayUrls, gunFilter, {
        onevent(event: any) {
          try {
            const msg = JSON.parse(event.content);
            markNostrInbound(msg);
            const peer = {
              url: 'nostr:' + event.pubkey,
              id: event.pubkey,
              pubkey: event.pubkey,
              nostr: true,
            };
            mesh.hear(msg, peer);
          } catch (_) { }
        },
        oneose() { },
      });

      root.on('out', function (this: any, msg: any) {
        this.to.next(msg);
        // Only publish put messages (writes). get/dam are reads/peer mgmt
        // that don't need Nostr persistence and waste rate limits.
        if (msg.put) {
          publishGunMessage(msg, pool, relayUrls, sk, finalizeEvent, opt);
        }
        if (msg.dam === 'hi') {
          relayUrls.forEach((url: string) => {
            const peer = {
              url,
              id: url,
              wire: { send: (raw: string) => publishRaw(raw, pool, [url], sk, finalizeEvent, opt) },
            };
            mesh.hi(peer);
          });
        }
      });

      setTimeout(function () {
        if (!opt.super) root.on('out', { dam: 'hi' });
      }, 1);
    });
  });
}

function createNostrMesh(root: any): any {
  const m: any = function () { };

  m.hear = function (raw: any, peer: any) {
    if (!raw) return;
    root.on('in', raw);
  };

  m.hi = function (peer: any) {
    if (!peer.url) return;
    if (peer.met) return;
    peer.met = +new Date();
    root.on('hi', peer);
  };

  m.bye = function (peer: any) {
    if (!peer.url) return;
    delete peer.met;
    root.on('bye', peer);
  };

  m.say = function (msg: any, peer?: any) {
    if (msg && msg['@']) return;
    if (peer && peer.url && peer.url.startsWith('nostr:')) return;
    return true;
  };

  return m;
}

function markNostrInbound(msg: any): void {
  if (Array.isArray(msg)) {
    msg.forEach(markNostrInbound);
    return;
  }
  if (msg && typeof msg === 'object') {
    msg.NTS = 1;
  }
}

function publishGunMessage(
  msg: any, pool: any, relays: string[],
  sk: Uint8Array, finalizeEvent: any, opt: any,
): void {
  try {
    const content = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (!content || content === '[]') return;
    const eventTemplate = {
      kind: Number(opt.nostr?.kind || DEFAULT_GUN_KIND),
      created_at: Math.floor(Date.now() / 1000),
      tags: [['g', GUN_TAG]],
      content,
    };
    const event = finalizeEvent(eventTemplate, sk);
    const results = pool.publish(relays, event);
    if (Array.isArray(results)) {
      results.forEach((p: Promise<any>) => p.catch((err) => logPublishFailure(err, opt)));
    }
  } catch (err) {
    logPublishFailure(err, opt);
  }
}

function publishRaw(
  raw: string, pool: any, relays: string[],
  sk: Uint8Array, finalizeEvent: any, opt: any,
): void {
  try {
    const eventTemplate = {
      kind: Number(opt.nostr?.kind || DEFAULT_GUN_KIND),
      created_at: Math.floor(Date.now() / 1000),
      tags: [['g', GUN_TAG]],
      content: raw,
    };
    const event = finalizeEvent(eventTemplate, sk);
    const results = pool.publish(relays, event);
    if (Array.isArray(results)) {
      results.forEach((p: Promise<any>) => p.catch((err) => logPublishFailure(err, opt)));
    }
  } catch (err) {
    logPublishFailure(err, opt);
  }
}

function logPublishFailure(err: any, opt: any): void {
  if (opt.nostr?.silent) return;
  Gun.log('garfo: Nostr publish failed: ' + (err?.message || err));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export default setupNostrTransport;
