# Garfo: A Browser-First Realtime Graph Database Fork of GUN.js

## Introduction

**Garfo** is a modern, browser-first fork of [GUN.js](https://gun.eco/) — the decentralized, offline-first graph database. The name "Garfo" (Portuguese for "fork") captures its essence: a fork of the original project that keeps the familiar GUN graph API while bringing meaningful improvements to the modern JavaScript ecosystem.

## Why a Fork?

GUN.js is a revolutionary technology — a graph database that syncs in real time, works peer-to-peer, resolves conflicts automatically, and runs in the browser. However, the JavaScript ecosystem has evolved. TypeScript has become the standard, ES modules are the norm, and new transport layers like **Nostr** have emerged as promising decentralized protocols.

Garfo was born to fill these gaps: a GUN rewritten with modern typing, designed with the browser as a first-class citizen, and with native support for the Nostr protocol.

## Key Features

### 🧠 Familiar Graph API

If you've used GUN before, you'll feel right at home. Garfo exposes the same chainable API:

```js
import Garfo from 'garfo';

const db = new Garfo({ localStorage: true });

db.get('users').get('alice').put({
  name: 'Alice',
  status: 'online'
});

db.get('users').get('alice').on(profile => {
  console.log('Update:', profile);
});
```

All the classic methods are there: `get()`, `put()`, `set()`, `on()`, `once()`, `map()`.

### 🌐 Optional Nostr Transport

This is one of the most exciting additions. Garfo can use **Nostr relays** as a transport layer, allowing peers to exchange graph messages through public or private relays:

```js
const db = new Garfo({
  nostr: {
    sk: 'private-key-hex',
    relays: ['wss://relay.damus.io', 'wss://nos.lol'],
  },
});

db.get('chat').get('general').set({
  from: 'alice',
  text: 'Hello over Nostr!',
  timestamp: Date.now(),
});
```

This unlocks immense possibilities: Garfo no longer depends solely on direct WebSocket connections — any Nostr relay can become a synchronization backbone.

### 🔒 SEA — Security, Encryption, Authorization

The SEA module is included, providing:
- Public/private key pairs for users
- End-to-end encryption
- Data signing and verification
- Proof-of-work for rate limiting

### 🗺️ Conflict Resolution (HAM)

Like original GUN, Garfo uses the **HAM** (Hear, Act, Modify) algorithm for conflict resolution. Every operation carries a state timestamp, and conflicts are resolved deterministically — no leader or global consensus required.

### 📦 Browser-First

Unlike GUN.js which carries a Node.js legacy, Garfo is built with the browser as the primary target:
- Native `localStorage` backend support
- Zero configuration to get started
- Web-optimized bundle
- TypeScript throughout

## Use Cases

Garfo shines in **local-first** and **decentralized** applications:

- **Peer-to-peer chat** — the repo includes a complete Nostr-backed chat example with React + TypeScript
- **Collaborative apps** — document editing, Kanban boards, shared whiteboards
- **P2P content delivery** — the repo has a livestream example using peer-to-peer CDN
- **Offline IoT** — field data collection with sync when online
- **Decentralized social networks** — combining graph data model with Nostr transport

## Example: Nostr Chat

The project ships with a working chat demo. Run `npm start`, open two browser tabs, and each creates a Nostr identity. Messages flow through relays and are stored locally:

```bash
git clone https://github.com/israelmarmar/garfo.git
cd garfo
npm install
npm start
# Open http://127.0.0.1:8900/ in two windows
```

The chat supports generating identities, copying public keys, backing up and restoring keys — recovering full history from relays.

## How Garfo Compares

| Feature | GUN.js | Garfo |
|---|---|---|
| Package name | `gun` | `garfo` |
| Constructor | `Gun` | `Garfo` (with `Gun` alias) |
| TypeScript | Limited | Full |
| Nostr transport | ❌ | ✅ Native |
| Focus | Node + Browser | Browser-first |
| Maintenance | Original community | Active fork |

## Technical Notes

Garfo retains the **graph node** architecture of original GUN. Each piece of data lives in a "soul" — a node identified by a unique key. Peers connect in a mesh and exchange graph deltas.

A key difference: while GUN.js was designed in a pre-TypeScript era, Garfo ships with complete types — you get intellisense and type checking out of the box.

## Linking vs Copying

Garfo's `set()` doesn't copy objects — it creates **links** (relationships) in the graph. This is fundamental to the data model: you don't duplicate data, you connect nodes.

## Licensing

Garfo keeps the upstream triple license: Zlib OR MIT OR Apache-2.0 — you choose. This guarantees maximum flexibility for both commercial and open-source projects.

## Conclusion

Garfo is not just a fork — it's an evolution tailored for the modern JavaScript ecosystem. It keeps what GUN.js does best (distributed graph, conflict resolution, offline-first) and adds what was missing: robust typing, browser focus, and Nostr integration.

If you're building a decentralized application and need a real-time syncing database without central servers, Garfo deserves your attention.

> **Links:** [GitHub Repository](https://github.com/israelmarmar/garfo) | [GUN.eco](https://gun.eco/) | [Nostr Protocol](https://nostr.com/)
