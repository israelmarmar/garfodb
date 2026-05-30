import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { Garfo } from '../../../src/index.ts';
import { setupNostrTransport } from '../../../src/nostr/index.ts';
import { 
  sendFileViaNostr, 
  receiveFileFromNostr, 
  saveFileToOPFS, 
  loadFileFromOPFS,
  setupFileChunkListener 
} from './fileManager';

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
  fileKey?: string;
  fileName?: string;
  fileMime?: string;
  fileSize?: number;
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
  const [fileUploadProgress, setFileUploadProgress] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message: string;
    progress: number;
  }>({ status: 'idle', message: '', progress: 0 });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const attachFileInputRef = useRef<HTMLInputElement | null>(null);
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

    // Configurar listener para chunks de arquivo via Nostr
    setupFileChunkListener((fileKey: string, metadata: any) => {
      console.log('[NostrChat] Novo arquivo recebido:', fileKey, metadata);
      // Aqui você processaria os chunks recebidos via Nostr
      // Por enquanto, apenas logamos o evento
    });

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
    if (!me || !msg?.from || !msg.to || !msg.time) return;
    if (!msg.text && !msg.fileKey) return;
    if (msg.to !== me && msg.from !== me) return;

    const msgKey = `${msg.from}|${msg.to}|${msg.time}|${msg.text}|${msg.fileKey || ''}`;
    if (seenMessagesRef.current[msgKey]) return;
    seenMessagesRef.current[msgKey] = true;

    const other = msg.from === me ? msg.to : msg.from;
    const entry: ChatMessage = {
      key,
      from: msg.from,
      to: msg.to,
      text: msg.text,
      time: Number(msg.time),
      fileKey: msg.fileKey,
      fileName: msg.fileName,
      fileMime: msg.fileMime,
      fileSize: msg.fileSize,
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

  async function handleFileAttach(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !identity || !gun) return;

    const target = recipient.trim();
    if (!target) {
      alert('Digite a chave pública do destinatário primeiro');
      event.target.value = '';
      return;
    }
    if (target === identity.publicKey) {
      alert('Você não pode enviar arquivos para si mesmo');
      event.target.value = '';
      return;
    }

    // Resetar estado de upload
    setFileUploadProgress({ status: 'idle', message: '', progress: 0 });
    
    // Mostrar feedback visual
    setFileUploadProgress({
      status: 'uploading',
      message: `Preparando arquivo: ${file.name}`,
      progress: 0
    });

    setStatus('Enviando arquivo...');

    try {
      const privateKeyBytes = hexToBytes(identity.privateKeyHex);
      
      const { fileKey, base64 } = await sendFileViaNostr(
        file,
        target,
        privateKeyBytes,
        (chunkIndex, totalChunks) => {
          const progress = Math.round((chunkIndex / totalChunks) * 100);
          setFileUploadProgress({
            status: 'uploading',
            message: `Enviando chunks: ${chunkIndex}/${totalChunks}`,
            progress
          });
          setStatus(`Enviando arquivo: ${chunkIndex}/${totalChunks} chunks`);
        }
      );

      const now = Date.now();
      const msgData: ChatMessage = {
        from: identity.publicKey,
        to: target,
        text: draft,
        time: now,
        fileKey,
        fileName: file.name,
        fileMime: file.type || 'application/octet-stream',
        fileSize: file.size,
      };

      setDraft('');
      setCurrentTarget(target);
      event.target.value = '';

      // Salvar no OPFS e publicar mensagem GUN em paralelo
      setFileUploadProgress({
        status: 'uploading',
        message: 'Salvando arquivo no armazenamento local...',
        progress: 90
      });

      await Promise.all([
        saveFileToOPFS(fileKey + '_' + file.name, base64ToUint8Array(base64)),
        (async () => {
          try {
            gun.get(CHAT_PATH).get('all').set(msgData);
            gun.get(CHAT_PATH).get('inbox').get(target).set(msgData);
          } catch (e) {
            console.error('[NostrChat] file send failed:', e);
            setStatus('Erro ao enviar mensagem de arquivo');
          }
        })()
      ]);

      acceptMessage(msgData, 'local-' + now);

      setFileUploadProgress({
        status: 'success',
        message: 'Arquivo enviado com sucesso!',
        progress: 100
      });
      setStatus('Arquivo enviado com sucesso!');

      setTimeout(() => {
        setFileUploadProgress({ status: 'idle', message: '', progress: 0 });
      }, 3000);
    } catch (error) {
      console.error('[NostrChat] file attach failed:', error);
      const errorMessage = 'Falha ao enviar arquivo: ' + (error as Error).message;
      
      setFileUploadProgress({
        status: 'error',
        message: errorMessage,
        progress: 0
      });
      setStatus(errorMessage);

      // Limpar erro após 5 segundos
      setTimeout(() => {
        setFileUploadProgress({ status: 'idle', message: '', progress: 0 });
      }, 5000);
    }
  }

  async function loadFileData(fileKey: string, knownFileName?: string, knownFileMime?: string, knownFileSize?: number): Promise<{ dataUrl: string; fileName: string; fileSize: number; fileMime: string }> {
    try {
      const fileName = knownFileName
        ? fileKey + '_' + knownFileName
        : fileKey + '_' + (await getFileNameFromMessage(fileKey));
      try {
        const fileData = await loadFileFromOPFS(fileName);
        const base64 = uint8ArrayToBase64(fileData);
        
        if (knownFileName && knownFileMime) {
          return {
            dataUrl: `data:${knownFileMime};base64,${base64}`,
            fileName: knownFileName,
            fileSize: knownFileSize || 0,
            fileMime: knownFileMime
          };
        }
        
        const metadata = await getFileMetadataFromMessage(fileKey);
        
        return {
          dataUrl: `data:${metadata.fileMime};base64,${base64}`,
          fileName: metadata.fileName,
          fileSize: metadata.fileSize,
          fileMime: metadata.fileMime
        };
      } catch (opfsError) {
        console.log('Arquivo não encontrado no OPFS, tentando via Nostr:', opfsError);
        
        // Se não encontrar no OPFS, tentar receber via Nostr
        const { dataUrl, fileName, fileSize, fileMime } = await receiveFileFromNostr(fileKey, (chunkIndex, totalChunks) => {
          setStatus(`Recebendo arquivo: ${chunkIndex}/${totalChunks} chunks`);
        });
        
        // Salvar no OPFS para uso futuro
        const base64Data = dataUrl.split(',')[1];
        const fileData = base64ToUint8Array(base64Data);
        await saveFileToOPFS(fileKey + '_' + fileName, fileData);
        
        return { dataUrl, fileName, fileSize, fileMime };
      }
    } catch (error) {
      console.error('[NostrChat] load file failed:', error);
      throw new Error('Falha ao carregar arquivo: ' + (error as Error).message);
    }
  }

  // Funções auxiliares para obter metadados da mensagem
  function getFileNameFromMessage(fileKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Primeiro buscar no estado local (mais rápido)
      for (const msgs of Object.values(conversations)) {
        for (const msg of msgs) {
          if (msg.fileKey === fileKey && msg.fileName) {
            resolve(msg.fileName);
            return;
          }
        }
      }

      if (!gun) {
        reject(new Error('Gun não disponível'));
        return;
      }

      // Buscar na caixa de entrada ou nas mensagens
      const searchPaths = [
        gun.get(CHAT_PATH).get('inbox').get(identity?.publicKey),
        gun.get(CHAT_PATH).get('all')
      ];

      searchPaths.forEach(path => {
        path.map().once((msg: ChatMessage) => {
          if (msg.fileKey === fileKey && msg.fileName) {
            resolve(msg.fileName);
          }
        });
      });

      // Timeout para evitar espera infinita
      setTimeout(() => reject(new Error('Nome do arquivo não encontrado')), 5000);
    });
  }

  function getFileMetadataFromMessage(fileKey: string): Promise<{ fileName: string; fileSize: number; fileMime: string }> {
    return new Promise((resolve, reject) => {
      // Primeiro buscar no estado local
      for (const msgs of Object.values(conversations)) {
        for (const msg of msgs) {
          if (msg.fileKey === fileKey) {
            resolve({
              fileName: msg.fileName || 'unknown',
              fileSize: msg.fileSize || 0,
              fileMime: msg.fileMime || 'application/octet-stream'
            });
            return;
          }
        }
      }

      if (!gun) {
        reject(new Error('Gun não disponível'));
        return;
      }

      gun.get(CHAT_PATH).get('all').map().once((msg: ChatMessage) => {
        if (msg.fileKey === fileKey) {
          resolve({
            fileName: msg.fileName || 'unknown',
            fileSize: msg.fileSize || 0,
            fileMime: msg.fileMime || 'application/octet-stream'
          });
        }
      });

      setTimeout(() => reject(new Error('Metadados do arquivo não encontrados')), 5000);
    });
  }

  async function listAllOPFSFiles() {
  // 1. Get the root of the Origin Private File System
  const root = await navigator.storage.getDirectory();

  // 2. Define a recursive function to walk through directories
  async function walk(directoryHandle, path = "") {
    for await (const [name, handle] of directoryHandle.entries()) {
      const fullPath = path ? `${path}/${name}` : name;
      
      if (handle.kind === 'directory') {
        console.log(`Directory: ${fullPath}`);
        // Recursively enter subdirectories
        await walk(handle, fullPath);
      } else {
        console.log(`File: ${fullPath}`);
      }
    }
  }

  await walk(root);
}

  async function downloadFileFromMessage(msg: ChatMessage) {
    if (!msg.fileKey || !gun) return;
    try {
      const { dataUrl, fileName } = await loadFileData(msg.fileKey, msg.fileName, msg.fileMime, msg.fileSize);
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (e: any) {
      console.error('[NostrChat] download failed:', e);
      alert('Download falhou: ' + e.message);
    }
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
                <div key={`${message.from}-${message.to}-${message.time}-${message.text}-${message.fileKey || ''}`} className={'message ' + (isMine ? 'mine' : 'other')}>
                  {!isMine && <div className="message-author">{shortenPk(message.from)}</div>}
                  <div className="message-text">
                    {message.text ? <div>{message.text}</div> : null}
                    {message.fileKey ? (
                      <div className="file-attachment">
                        <span className="file-name">{message.fileName || 'File'}</span>
                        <span className="file-size">{formatFileSize(message.fileSize || 0)}</span>
                        <button type="button" className="file-download" onClick={() => downloadFileFromMessage(message)}>Download</button>
                      </div>
                    ) : null}
                  </div>
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
            <button type="button" className="attach-btn" onClick={() => attachFileInputRef.current?.click()}>Attach</button>
            <button type="submit">Send</button>
            <input ref={attachFileInputRef} type="file" hidden onChange={handleFileAttach} />
          </form>

          {/* Indicador de progresso de upload */}
          {fileUploadProgress.status !== 'idle' && (
            <div className={`file-upload-progress file-upload-progress-${fileUploadProgress.status} ${fileUploadProgress.status === 'uploading' ? 'file-uploading' : ''}`}>
              <div className="progress-text">{fileUploadProgress.message}</div>
              {fileUploadProgress.status === 'uploading' && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${fileUploadProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// Funções auxiliares para conversão de base64 e Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default App;
