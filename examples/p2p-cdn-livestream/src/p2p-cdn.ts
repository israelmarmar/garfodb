import { Garfo, setupNostrTransport } from 'garfo';
import { SimplePool } from 'nostr-tools';
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure';

if (!(setupNostrTransport as any).__registered__) {
  (setupNostrTransport as any).__registered__ = true;
  setupNostrTransport();
}

export const DEFAULT_NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.current.fyi',
];

const STALE_CUTOFF = 5 * 60 * 1000;
const RELAY_WATCH_TIME = 20_000;
const AUTO_ASSIGN_INTERVAL = 120_000;
const CLEANUP_INTERVAL = 300_000;
const MAX_RELAY_DEPTH = 3;

export type StreamMeta = {
  broadcaster: string;
  live: boolean;
  title: string;
  startedAt: number;
  peerCount: number;
};

export type ViewerInfo = {
  pubkey: string;
  joinedAt: number;
  role: 'viewer' | 'relay';
  active: boolean;
  lastSeen: number;
  relayDepth: number;
  assignedBy: string | null;
};

export type RelayAssignment = {
  depth: number;
  assignedAt: number;
  assignedBy: string;
};

export type RelayAvailability = {
  available: boolean;
  depth: number;
  peerCount: number;
  lastHeartbeat: number;
};

export type P2PCDNStreamOptions = {
  title?: string;
  relays?: string[];
};

export class P2PCDNStream {
  peerId: string;
  pubkey: string;
  private sk: Uint8Array;

  streamId: string;
  relays: string[];
  private kind = 1990;

  role: 'broadcaster' | 'viewer' | null = null;
  private title = '';
  private destroyed = false;

  peerCount = 0;
  isRelay = false;
  relayDepth = 0;
  relayAssignedBy: string | null = null;

  private db: any;
  private pool: SimplePool;

  onStatus: ((msg: string) => void) | null = null;
  onMetaChange: ((meta: StreamMeta | null) => void) | null = null;
  onPeerConnect: ((peerId: string) => void) | null = null;
  onPeerDisconnect: ((peerId: string) => void) | null = null;
  onViewerListChange: ((viewers: ViewerInfo[]) => void) | null = null;
  onWebRTCSignal: ((signal: any, pubkey: string) => void) | null = null;
  onViewerAnnounce: ((pubkey: string) => void) | null = null;

  private knownViewers: Map<string, ViewerInfo> = new Map();
  private assignedRelays: Set<string> = new Set();
  private processedSignals: Set<string> = new Set();

  private autoAssignInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(streamId: string, options: P2PCDNStreamOptions = {}) {
    this.sk = generateSecretKey();
    this.pubkey = getPublicKey(this.sk);
    this.peerId = this.pubkey.slice(0, 12);
    this.streamId = streamId;
    this.relays = normalizeRelays(options.relays);
    this.title = options.title?.trim() || 'Livestream ' + new Date().toLocaleTimeString();

    this.db = new Garfo({
      localStorage: false,
      radisk: false,
      nostr: {
        relays: this.relays,
        sk: this.sk,
        silent: true,
      },
    });
    this.pool = new SimplePool();
  }

  /* ─── Public API ─── */

  async startBroadcast(): Promise<void> {
    if (this.destroyed) return;
    this.role = 'broadcaster';

    this.nostrPublish({ type: 'meta', live: true, title: this.title, startedAt: Date.now(), peerCount: 0, broadcaster: this.pubkey });
    this.db.get('streams').get(this.streamId).get('meta').put({ live: true, title: this.title, startedAt: Date.now(), peerCount: 0, broadcaster: this.pubkey });

    this.watchNostrViewers();
    this.watchNostrSignals();

    this.autoAssignInterval = setInterval(() => this.autoAssignRelays(), AUTO_ASSIGN_INTERVAL);
    this.cleanupInterval = setInterval(() => this.cleanupStale(), CLEANUP_INTERVAL);

    this.onStatus?.('📡 Transmissão via Nostr + Garfo (relay tree).');
    this.onStatus?.('✅ Transmissão iniciada! ID: ' + this.streamId);
    this.onStatus?.('🔑 Pubkey: ' + this.pubkey.slice(0, 16) + '...');
    this.onStatus?.('🛰️ Relays: ' + this.relays.join(', '));
  }

  async startWatching(): Promise<void> {
    if (this.destroyed) return;
    this.role = 'viewer';

    this.nostrPublish({ type: 'presence', active: true, joinedAt: Date.now(), role: this.isRelay ? 'relay' : 'viewer', relayDepth: this.relayDepth, assignedBy: this.relayAssignedBy });
    this.db.get('streams').get(this.streamId).get('viewers').get(this.pubkey).put({ pubkey: this.pubkey, active: true, joinedAt: Date.now() });

    this.watchNostrMeta();
    this.watchNostrViewers();
    this.watchNostrRelayAssignments();
    this.watchNostrSignals();

    this.autoAssignInterval = setInterval(() => this.autoAssignRelays(), AUTO_ASSIGN_INTERVAL);

    this.onStatus?.('🔍 Conectando ao stream ' + this.streamId + '...');
    this.onStatus?.('🛰️ Relays: ' + this.relays.join(', '));
  }

  assignRelay(viewerPubkey: string): void {
    if (this.destroyed || !this.role || viewerPubkey === this.pubkey || this.assignedRelays.has(viewerPubkey)) return;

    const depth = this.role === 'broadcaster' ? 1 : this.relayDepth + 1;
    if (depth > MAX_RELAY_DEPTH) {
      this.onStatus?.('⚠️ Profundidade máxima de relay (' + MAX_RELAY_DEPTH + ') atingida.');
      return;
    }

    this.assignedRelays.add(viewerPubkey);
    this.nostrPublish({ type: 'relay', pubkey: viewerPubkey, depth, assignedAt: Date.now(), assignedBy: this.pubkey });
    this.onStatus?.('📋 Relay designado: ' + viewerPubkey.slice(0, 12) + '... (profundidade ' + depth + ')');

    const streamPath = this.db.get('streams').get(this.streamId);
    streamPath.get('relays').get(viewerPubkey).put({ depth, assignedAt: Date.now(), assignedBy: this.pubkey, active: true });
    streamPath.get('relay-tree').get(this.pubkey).get('children').get(viewerPubkey).put({ depth, assignedAt: Date.now() });

    const viewer = this.knownViewers.get(viewerPubkey);
    if (viewer) {
      viewer.role = 'relay';
      viewer.relayDepth = depth;
      viewer.assignedBy = this.pubkey;
      this.emitViewerList();
    }
  }

  destroy(): void {
    this.destroyed = true;
    if (this.role === 'broadcaster') {
      this.nostrPublish({ type: 'meta', live: false });
    }
    if (this.role === 'viewer') {
      this.nostrPublish({ type: 'presence', active: false, pubkey: this.pubkey });
    }
    if (this.autoAssignInterval) clearInterval(this.autoAssignInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.pool.close(this.relays);
    this.knownViewers.clear();
    this.assignedRelays.clear();
    this.processedSignals.clear();
  }

  sendSignal(to: string, signalType: 'offer' | 'answer' | 'candidate', payload: any): void {
    if (this.destroyed) return;
    this.nostrPublish({ type: 'signal', to, signalType, time: Date.now(), sdp: payload.sdp, candidate: payload.candidate });
  }

  getViewers(): ViewerInfo[] {
    return Array.from(this.knownViewers.values());
  }

  private emitViewerList(): void {
    this.onViewerListChange?.(this.getViewers());
  }

  /* ─── Nostr operations ─── */

  private nostrPublish(data: any): void {
    try {
      const template = {
        kind: this.kind,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', this.streamId]],
        content: JSON.stringify({ streamId: this.streamId, ...data }),
      };
      const event = finalizeEvent(template, this.sk);
      this.pool.publish(this.relays, event).forEach(p => p.catch(() => {}));
    } catch (e: any) {
      this.onStatus?.('⚠️ Erro ao publicar: ' + (e?.message || e));
    }
  }

  private nostrSubscribe(cb: (data: any, event: any) => void): void {
    this.pool.subscribeMany(this.relays, {
      kinds: [this.kind],
      '#d': [this.streamId],
      limit: 100,
    } as any, {
      onevent(event: any) {
        try {
          const data = JSON.parse(event.content);
          cb(data, event);
        } catch (_) {}
      },
      oneose() {},
    });
  }

  /* ─── Meta ─── */

  private watchNostrMeta(): void {
    this.nostrSubscribe((data: any) => {
      if (this.destroyed || data.type !== 'meta' || !data.broadcaster) return;
      this.onMetaChange?.(data);
      this.onPeerConnect?.(data.broadcaster);
      this.onStatus?.('📺 Broadcaster: ' + data.broadcaster.slice(0, 16) + '...');
      if (!data.live) {
        this.onStatus?.('⏹️ Stream encerrado pelo broadcaster.');
        this.onPeerDisconnect?.(data.broadcaster);
      }
    });
  }

  /* ─── Viewer Presence ─── */

  private watchNostrViewers(): void {
    this.nostrSubscribe((data: any, event: any) => {
      if (this.destroyed || data.type !== 'presence') return;
      const pubkey = event.pubkey;
      if (pubkey === this.pubkey) return;

      if (!data.active) {
        if (this.knownViewers.has(pubkey)) {
          this.knownViewers.delete(pubkey);
          this.emitViewerList();
          this.onPeerDisconnect?.(pubkey);
        }
        return;
      }

      if (!this.knownViewers.has(pubkey)) {
        const viewer: ViewerInfo = {
          pubkey,
          joinedAt: data.joinedAt || Date.now(),
          role: data.role || 'viewer',
          active: true,
          lastSeen: Date.now(),
          relayDepth: data.relayDepth || 0,
          assignedBy: data.assignedBy || null,
        };
        this.knownViewers.set(pubkey, viewer);
        this.emitViewerList();
        this.onPeerConnect?.(pubkey);
        this.onViewerAnnounce?.(pubkey);
      } else {
        const existing = this.knownViewers.get(pubkey)!;
        existing.lastSeen = Date.now();
        existing.role = data.role || existing.role;
      }
    });
  }

  /* ─── Relay ─── */

  private watchNostrRelayAssignments(): void {
    this.nostrSubscribe((data: any) => {
      if (this.destroyed || data.type !== 'relay') return;
      if (data.pubkey !== this.pubkey) return;
      if (this.isRelay) return;

      this.isRelay = true;
      this.relayDepth = data.depth || 1;
      this.relayAssignedBy = data.assignedBy;
      this.onStatus?.('🔁 Designado RELAY por ' + (data.assignedBy || '').slice(0, 12) + '... (profundidade ' + this.relayDepth + ')');

      this.nostrPublish({ type: 'relay-avail', available: true, depth: this.relayDepth, peerCount: 0 });
    });
  }

  /* ─── Signals ─── */

  private watchNostrSignals(): void {
    this.nostrSubscribe((data: any, event: any) => {
      if (this.destroyed) return;
      const fromPubkey = event.pubkey;
      if (fromPubkey === this.pubkey) return;
      if (data.to !== this.pubkey) return;

      const signalId = [fromPubkey, data.to, data.signalType, data.time].join(':');
      if (this.processedSignals.has(signalId)) return;
      this.processedSignals.add(signalId);

      const payload: any = { type: data.signalType };
      if (data.sdp != null) payload.sdp = data.sdp;
      if (data.candidate != null) payload.candidate = data.candidate;
      this.onWebRTCSignal?.(payload, fromPubkey);
    });
  }

  /* ─── Relay Auto-Assign ─── */

  private autoAssignRelays(): void {
    if (this.destroyed) return;
    if (this.role !== 'broadcaster' && !this.isRelay) return;
    const maxDepth = this.role === 'broadcaster' ? 1 : this.relayDepth + 1;
    if (maxDepth > MAX_RELAY_DEPTH) return;

    const maxChildren = this.role === 'broadcaster' ? 3 : 2;
    const ourChildren = Array.from(this.assignedRelays).filter(p => {
      const v = this.knownViewers.get(p);
      return v && v.assignedBy === this.pubkey;
    });
    if (ourChildren.length >= maxChildren) return;

    const now = Date.now();
    const eligible: ViewerInfo[] = [];
    for (const viewer of this.knownViewers.values()) {
      if (viewer.role === 'relay') continue;
      if (now - viewer.joinedAt < RELAY_WATCH_TIME) continue;
      if (now - viewer.lastSeen > 60_000) continue;
      eligible.push(viewer);
    }
    if (eligible.length === 0) return;
    eligible.sort((a, b) => a.joinedAt - b.joinedAt);
    this.assignRelay(eligible[0].pubkey);
  }

  private cleanupStale(): void {
    if (this.destroyed) return;
    const now = Date.now();
    let changed = false;
    for (const [pubkey, viewer] of this.knownViewers) {
      if (now - viewer.lastSeen > 180_000) {
        this.knownViewers.delete(pubkey);
        this.assignedRelays.delete(pubkey);
        this.db.get('streams').get(this.streamId).get('relays').get(pubkey).put({ active: false, leftAt: now });
        changed = true;
      }
    }
    if (changed) this.emitViewerList();
  }
}

/* ─── Utility ─── */

function normalizeRelays(relays?: string[]): string[] {
  const clean = (relays || DEFAULT_NOSTR_RELAYS)
    .map(r => r.trim())
    .filter(r => r.startsWith('wss://') || r.startsWith('ws://'));
  return Array.from(new Set(clean.length ? clean : DEFAULT_NOSTR_RELAYS));
}
