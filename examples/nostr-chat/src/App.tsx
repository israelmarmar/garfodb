import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { Garfo } from '../../../src/index.ts';
import { setupNostrTransport } from '../../../src/nostr/index.ts';

setupNostrTransport();

const CHAT_PATH = 'nostr-chat-v1';
const IDENTITY_STORAGE_KEY = 'nostr-chat-identity-v1';

type Identity = {
  privateKeyHex: string;
  publicKey: string;
};

type ChatMessage = {
  key?: string;
  from: string;
  to: string;
  text: string;
  time: number;
};

type ConversationMap = Record<string, ChatMessage[]>;

type GarfoRoot = InstanceType<typeof Garfo> & {
  _: {
    graph?: Record<string, any>;
    on: (event: string, cb: (this: any, msg: any) => void) => void;
  };
};

function App() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [status, setStatus] = useState('Initializing...');
  const [recipient, setRecipient] = useState('');
  const [draft, setDraft] = useState('');
  const [currentTarget, setCurrentTarget] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationMap>({});
  const [copied, setCopied] = useState(false);
  const [gun, setGun] = useState<GarfoRoot | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const seenMessagesRef = useRef<Record<string, true>>({});
  const identityRef = useRef<Identity | null>(null);

  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  useEffect(() => {
    const restored = loadStoredIdentity();
    if (restored) {
      setIdentity(restored);
      setStatus('Identity restored');
      return;
    }

    const created = createIdentity();
    saveIdentity(created);
    setIdentity(created);
    setStatus('New identity created');
  }, []);

  useEffect(() => {
    if (!identity) return;

    console.log('[NostrChat] keypair ready: ' + identity.publicKey.substring(0, 8) + '...');
    setStatus('Connecting to Nostr relays...');

    let db: GarfoRoot;
    try {
      db = new Garfo({
        localStorage: false,
        radisk: false,
        nostr: { sk: identity.privateKeyHex },
      }) as GarfoRoot;
      setGun(db);
      console.log('[NostrChat] Garfo created');
    } catch (e: any) {
      console.error('[NostrChat] Garfo creation failed:', e);
      setStatus('Error: ' + e.message);
      return;
    }

    try {
      const inbox = db.get(CHAT_PATH).get('inbox').get(identity.publicKey);
      inbox.map().on((msg: ChatMessage, key: string) => {
        acceptMessage(msg, key);
      });

      db._.on('put', function (this: any, msg: any) {
        this.to.next(msg);
        const soul = msg?.put?.['#'];
        if (!soul) return;
        acceptMessage(db._.graph?.[soul], soul);
      });
      console.log('[NostrChat] inbox chain ready');
    } catch (e) {
      console.error('[NostrChat] chain setup failed:', e);
      setStatus('Chain setup failed');
      return;
    }

    const timer = window.setTimeout(() => {
      setStatus('Connected via Nostr relays');
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [identity?.publicKey]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [conversations, currentTarget]);

  const conversationKeys = useMemo(() => {
    return Object.keys(conversations).sort((a, b) => {
      return getLastMessageTime(conversations[b]) - getLastMessageTime(conversations[a]);
    });
  }, [conversations]);

  const currentMessages = currentTarget ? conversations[currentTarget] || [] : [];

  function acceptMessage(msg: ChatMessage | undefined, key?: string) {
    const me = identityRef.current?.publicKey;
    if (!me || !msg?.from || !msg.text || !msg.to || !msg.time) return;
    if (msg.to !== me && msg.from !== me) return;

    const msgKey = `${msg.from}|${msg.to}|${msg.time}|${msg.text}`;
    if (seenMessagesRef.current[msgKey]) return;
    seenMessagesRef.current[msgKey] = true;

    const other = msg.from === me ? msg.to : msg.from;
    const entry: ChatMessage = {
      key,
      from: msg.from,
      to: msg.to,
      text: msg.text,
      time: Number(msg.time),
    };

    setConversations((prev) => {
      const next = { ...prev };
      next[other] = [...(next[other] || []), entry].sort(compareMessages);
      return next;
    });
  }

  function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    if (!identity || !gun) return;

    const target = recipient.trim();
    const text = draft.trim();
    if (!target || !text) return;
    if (target === identity.publicKey) {
      alert('You cannot message yourself');
      return;
    }

    const now = Date.now();
    const msgData: ChatMessage = {
      from: identity.publicKey,
      to: target,
      text,
      time: now,
    };

    setDraft('');
    setCurrentTarget(target);

    try {
      gun.get(CHAT_PATH).get('all').set(msgData);
      gun.get(CHAT_PATH).get('inbox').get(target).set(msgData);
      console.log('[NostrChat] .set() done');
    } catch (e) {
      console.error('[NostrChat] .set() failed:', e);
    }

    acceptMessage(msgData, 'local-' + now);
  }

  async function copyPublicKey() {
    if (!identity) return;
    await navigator.clipboard.writeText(identity.publicKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function createNewIdentity() {
    if (!confirm('Generate a new identity? Back up this identity first if you want to use it again later.')) return;
    const next = createIdentity();
    saveIdentity(next);
    alert('New identity created: ' + shortenPk(next.publicKey));
    location.reload();
  }

  function backupIdentity() {
    if (!identity) return;
    downloadIdentity(identity);
  }

  async function restoreIdentity(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = parseIdentityFile(await file.text());
      saveIdentity(imported);
      alert('Identity restored: ' + shortenPk(imported.publicKey));
      location.reload();
    } catch (e: any) {
      alert('Invalid identity file: ' + e.message);
    } finally {
      event.target.value = '';
    }
  }

  function selectConversation(pubkey: string) {
    setCurrentTarget(pubkey);
    setRecipient(pubkey);
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Nostr Chat</h1>
        <div className="my-id">
          <span>{identity?.publicKey || 'loading...'}</span>
          <button type="button" onClick={copyPublicKey}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <div className="identity-actions">
          <button type="button" onClick={createNewIdentity}>New identity</button>
          <button type="button" onClick={backupIdentity}>Backup keys</button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>Restore keys</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={restoreIdentity} />
        </div>
        <span className="status">{status}</span>
      </header>

      <main className="main">
        <aside className="sidebar">
          <h3>Conversations</h3>
          <div className="conversation-list">
            {conversationKeys.length === 0 ? (
              <div className="empty">No messages yet</div>
            ) : conversationKeys.map((other) => {
              const last = conversations[other][conversations[other].length - 1];
              return (
                <button
                  key={other}
                  type="button"
                  className={'conversation' + (other === currentTarget ? ' active' : '')}
                  onClick={() => selectConversation(other)}
                >
                  <div className="conversation-id">{shortenPk(other)}</div>
                  <div className="conversation-preview">{last?.text || ''}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="chat-area">
          <div className="recipient-row">
            <input
              type="text"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Recipient public key..."
            />
          </div>

          <div ref={messagesRef} className="messages">
            {!currentTarget || currentMessages.length === 0 ? (
              <div className="empty">Select a conversation or enter a public key to start chatting</div>
            ) : currentMessages.map((message) => {
              const isMine = message.from === identity?.publicKey;
              return (
                <div key={`${message.from}-${message.to}-${message.time}-${message.text}`} className={'message ' + (isMine ? 'mine' : 'other')}>
                  {!isMine && <div className="message-author">{shortenPk(message.from)}</div>}
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">{new Date(message.time).toLocaleTimeString()}</div>
                </div>
              );
            })}
          </div>

          <form className="input-row" onSubmit={sendMessage}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message..."
              autoFocus
            />
            <button type="submit">Send</button>
          </form>
        </section>
      </main>
    </div>
  );
}

function createIdentity(): Identity {
  const privateKey = generateSecretKey();
  const privateKeyHex = bytesToHex(privateKey);
  return {
    privateKeyHex,
    publicKey: getPublicKey(privateKey),
  };
}

function loadStoredIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (!raw) return null;
    return parseIdentityFile(raw);
  } catch {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
    return null;
  }
}

function saveIdentity(identity: Identity) {
  localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify({
    version: 1,
    type: 'nostr-chat-identity',
    publicKey: identity.publicKey,
    privateKeyHex: identity.privateKeyHex,
    savedAt: new Date().toISOString(),
  }));
}

function parseIdentityFile(text: string): Identity {
  const data = JSON.parse(text);
  const privateKeyHex = String(data.privateKeyHex || data.sk || data.privateKey || '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(privateKeyHex)) {
    throw new Error('privateKeyHex must be 64 lowercase hex characters');
  }

  const publicKey = getPublicKey(hexToBytes(privateKeyHex));
  if (data.publicKey && String(data.publicKey).toLowerCase() !== publicKey) {
    throw new Error('public key does not match private key');
  }

  return { privateKeyHex, publicKey };
}

function downloadIdentity(identity: Identity) {
  const payload = JSON.stringify({
    version: 1,
    type: 'nostr-chat-identity',
    publicKey: identity.publicKey,
    privateKeyHex: identity.privateKeyHex,
    exportedAt: new Date().toISOString(),
  }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'nostr-chat-' + identity.publicKey.substring(0, 12) + '.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function shortenPk(pk: string) {
  if (!pk || pk.length < 12) return pk || '';
  return pk.substring(0, 6) + '...' + pk.substring(pk.length - 4);
}

function compareMessages(a: ChatMessage, b: ChatMessage) {
  const dt = Number(a.time || 0) - Number(b.time || 0);
  if (dt) return dt;
  return String(a.key || '').localeCompare(String(b.key || ''));
}

function getLastMessageTime(messages: ChatMessage[]) {
  const last = messages[messages.length - 1];
  return Number((last && last.time) || 0);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default App;
