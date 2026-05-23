# Garfo

Garfo is a browser-first realtime graph database fork with optional Nostr transport. It keeps the familiar GUN-style graph API while exposing the package as `garfo` and the public constructor as `Garfo`.

The project is designed for local-first applications that need:

- Realtime graph synchronization
- Offline-friendly browser storage
- Conflict resolution with GUN/HAM-style state timestamps
- Optional peer-to-peer synchronization over WebSocket
- Optional relay-based synchronization over Nostr
- SEA cryptographic utilities for user and data workflows

`Gun` is still exported as a compatibility alias, but new code should import and instantiate `Garfo`.

## Install

```bash
npm install garfo
```

Nostr transport depends on `nostr-tools`. It is optional, but required when using `nostr` options:

```bash
npm install garfo nostr-tools
```

## Basic Usage

```js
import Garfo from 'garfo';

const db = new Garfo({
  localStorage: true,
  radisk: false,
});

db.get('profile').put({
  name: 'Ada',
  status: 'online',
});

db.get('profile').on((profile) => {
  console.log(profile);
});
```

Named import is also supported:

```js
import { Garfo } from 'garfo';

const db = new Garfo();
```

For compatibility with existing code:

```js
import { Gun } from 'garfo';

const db = new Gun();
```

## Nostr Transport

Garfo can use Nostr relays as a transport layer. This lets browser clients exchange Garfo graph messages through public or private Nostr relays.

```js
import { Garfo } from 'garfo';

const db = new Garfo({
  localStorage: false,
  radisk: false,
  nostr: {
    sk: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    relays: [
      'wss://relay.damus.io',
      'wss://nos.lol',
    ],
  },
});

db.get('chat').get('messages').set({
  from: 'alice',
  text: 'Hello over Nostr',
  time: Date.now(),
});
```

If no relays are provided, Garfo uses the default relay list configured in `src/nostr/index.ts`.

The transport uses regular Nostr events with kind `9111` by default. You may override it:

```js
const db = new Garfo({
  nostr: {
    kind: 9123,
    relays: ['wss://relay.example.com'],
  },
});
```

## Browser Chat Example

This repository includes a Nostr-backed React + TypeScript chat demo:

```bash
npm start
```

The root `npm start` command runs the app in `test/nostr-chat` with Vite.
You can also run it directly:

```bash
cd test/nostr-chat
npm start
```

Open two browser windows at:

```text
http://127.0.0.1:8900/
```

Each window creates a Nostr identity. The UI can:

- Copy the public identifier
- Generate a new identity
- Back up keys to a JSON file
- Restore keys from a JSON file
- Recover messages from relay history after restoring an identity

## Build

```bash
npm run build
```

The TypeScript source lives in `src/` and compiled output is written to `dist/`.

## API Notes

Garfo stores data as graph nodes. The most common chain methods are:

- `get(key)` to navigate to a soul or field
- `put(data)` to write data
- `set(data)` to append/link an item
- `on(callback)` to subscribe to realtime changes
- `once(callback)` to read once
- `map()` to iterate child fields

Example:

```js
const messages = db.get('room/main/messages');

messages.set({
  text: 'First message',
  time: Date.now(),
});

messages.map().on((message, key) => {
  console.log(key, message);
});
```

## Acknowledgments
```text
https://gun.eco/
```


## License

This project keeps the upstream license family:

```text
Zlib OR MIT OR Apache-2.0
```
