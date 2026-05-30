import { getPublicKey, finalizeEvent, SimplePool } from 'nostr-tools';

interface FileChunk {
  chunk: string;
  index: number;
  total: number;
  fileKey: string;
}

interface FileMetadata {
  name: string;
  mime: string;
  size: number;
  totalChunks: number;
  timestamp: number;
  sender: string;
  recipient: string;
}

// Configuração de relays Nostr - usando relays mais permissivos
const DEFAULT_RELAYS: string[] = [
  'wss://relay.damus.io',
  'wss://nostr-relay.untethr.me',
  'wss://nostr.wlvs.space',
  'wss://relay.nostr.band',
  'wss://nostr.oxtr.dev'
];

// Fallback relays caso os principais bloqueiem
const FALLBACK_RELAYS: string[] = [
  'wss://relay.snort.social',
  'wss://nostr.fmt.wiz.biz',
  'wss://nostr.mom',
  'wss://nostr-pub.semisol.dev'
];

let pool: SimplePool | null = null;

function getPool(): SimplePool {
  if (!pool) {
    pool = new SimplePool();
    // Adicionar relays padrão
    DEFAULT_RELAYS.forEach(relay => {
      pool!.ensureRelay(relay).catch(err => {
        console.warn('Falha ao conectar com relay:', relay, err);
      });
    });
  }
  return pool;
}

// Função para dividir arquivo em chunks e enviá-los via Nostr
export async function sendFileViaNostr(
  file: File,
  recipientPublicKey: string,
  senderPrivateKey: Uint8Array,
  onChunkSent?: (chunkIndex: number, totalChunks: number) => void
): Promise<{ fileKey: string; base64: string }> {
  const CHUNK_SIZE = 60000;
  const CONCURRENCY = 5;
  const fileKey = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const base64 = await fileToBase64(file);
  
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.substring(i, i + CHUNK_SIZE));
  }
  
  const totalChunks = chunks.length;
  const senderPubkey = getPublicKey(senderPrivateKey);
  const metadata: FileMetadata = {
    name: file.name,
    mime: file.type || 'application/octet-stream',
    size: file.size,
    totalChunks,
    timestamp: Date.now(),
    sender: senderPubkey,
    recipient: recipientPublicKey
  };
  const now = Math.floor(Date.now() / 1000);

  console.log('[FileManager] Enviando arquivo:', file.name, 'com', totalChunks, 'chunks');

  await publishNostrEvent(
    {
      kind: 1061,
      created_at: now,
      tags: [
        ['f', fileKey],
        ['mime', metadata.mime],
        ['size', metadata.size.toString()],
        ['chunks', totalChunks.toString()],
        ['name', metadata.name],
        ['p', recipientPublicKey],
        ['expiration', (now + 86400).toString()],
        ['type', 'file-metadata']
      ],
      content: JSON.stringify(metadata)
    },
    senderPrivateKey
  );

  let sent = 0;
  for (let start = 0; start < totalChunks; start += CONCURRENCY) {
    const batch = chunks.slice(start, start + CONCURRENCY);
    await Promise.all(batch.map(async (chunk, offset) => {
      const i = start + offset;
      await publishNostrEvent(
        {
          kind: 1062,
          created_at: now,
          tags: [
            ['f', fileKey],
            ['chunk', i.toString()],
            ['total', totalChunks.toString()],
            ['type', 'file-chunk']
          ],
          content: JSON.stringify({ chunk, index: i, total: totalChunks, fileKey })
        },
        senderPrivateKey
      );
    }));
    sent += batch.length;
    onChunkSent?.(sent, totalChunks);
  }

  console.log('[FileManager] Arquivo enviado com sucesso:', fileKey);
  return { fileKey, base64 };
}

// Função para receber chunks via Nostr e reconstruir arquivo
export async function receiveFileFromNostr(
  fileKey: string,
  onChunkReceived?: (chunkIndex: number, totalChunks: number) => void
): Promise<{ dataUrl: string; fileName: string; fileSize: number; fileMime: string }> {
  console.log('[FileManager] Recebendo arquivo:', fileKey);
  
  // Criar IndexedDB para armazenar chunks temporariamente
  const db = await createFileChunkDB();
  const chunksStore = db.transaction('fileChunks', 'readwrite').objectStore('fileChunks');
  
  // Limpar chunks antigos para este arquivo
  const clearFileChunks = chunksStore.index('fileKey').getAll(fileKey);
  await new Promise((resolve, reject) => {
    clearFileChunks.onsuccess = () => resolve(null);
    clearFileChunks.onerror = () => reject(clearFileChunks.error);
  });

  // Filtrar eventos de metadata e chunks
  const metadataFilter = {
    kinds: [1061],
    '#f': [fileKey],
    limit: 1
  };

  const chunkFilter = {
    kinds: [1062],
    '#f': [fileKey]
  };

  const allRelays = [...DEFAULT_RELAYS, ...FALLBACK_RELAYS];
  const pool = getPool();
  
  try {
    // Buscar eventos de metadata
    const metadataEvents: any[] = [];
    const metadataSub = pool.subscribeMany(allRelays, metadataFilter, {
      onevent(event) {
        metadataEvents.push(event);
      },
      oneose() {
        // Fim da subscrição
      }
    });
    
    // Aguardar um pouco para coletar eventos
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (metadataEvents.length === 0) {
      throw new Error('Metadados do arquivo não encontrados em nenhum relay');
    }

    const metadata = JSON.parse(metadataEvents[0].content);
    console.log('[FileManager] Metadados encontrados:', metadata.name);

    // Buscar eventos de chunks
    const chunkEvents: any[] = [];
    const chunkSub = pool.subscribeMany(allRelays, chunkFilter, {
      onevent(event) {
        chunkEvents.push(event);
      },
      oneose() {
        // Fim da subscrição
      }
    });
    
    // Aguardar mais tempo para chunks (podem ser muitos)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (chunkEvents.length === 0) {
      throw new Error('Nenhum chunk encontrado para este arquivo');
    }

    console.log(`[FileManager] Encontrados ${chunkEvents.length} chunks para ${metadata.name}`);

    // Processar chunks
    const chunks: { data: string; index: number }[] = [];
    const receivedIndexes = new Set<number>();
    
    for (const event of chunkEvents) {
      try {
        const chunkData: FileChunk = JSON.parse(event.content);
        
        // Evitar chunks duplicados
        if (receivedIndexes.has(chunkData.index)) {
          continue;
        }
        receivedIndexes.add(chunkData.index);
        
        chunks.push({
          data: chunkData.chunk,
          index: chunkData.index
        });
        
        // Armazenar chunk no IndexedDB
        const addRequest = chunksStore.add({
          fileKey,
          index: chunkData.index,
          total: chunkData.total,
          data: chunkData.chunk,
          metadata
        });
        
        await new Promise((resolve, reject) => {
          addRequest.onsuccess = () => resolve(null);
          addRequest.onerror = () => reject(addRequest.error);
        });
        
        onChunkReceived?.(chunkData.index + 1, chunkData.total);
        
      } catch (error) {
        console.warn('Falha ao processar chunk:', error);
      }
    }

    // Ordenar chunks por índice
    chunks.sort((a, b) => a.index - b.index);
    
    // Verificar se temos todos os chunks esperados
    if (chunks.length > 0 && chunks[0].total && chunks.length < chunks[0].total) {
      console.warn(`[FileManager] Aviso: chunks incompletos. Esperado: ${chunks[0].total}, Recebido: ${chunks.length}`);
    }
    
    // Juntar todos os chunks
    const base64 = chunks.map(chunk => chunk.data).join('');
    
    console.log('[FileManager] Arquivo reconstruído:', metadata.name, chunks.length, 'chunks');
    
    return {
      dataUrl: `data:${metadata.mime};base64,${base64}`,
      fileName: metadata.name,
      fileSize: metadata.size,
      fileMime: metadata.mime
    };
  } catch (error) {
    console.error('[FileManager] Erro ao receber arquivo:', error);
    throw error;
  } finally {
    // Fechar pool após uso
    if (pool) {
      pool.close(allRelays);
    }
  }
}

// Função para salvar arquivo no OPFS (Open File System)
export async function saveFileToOPFS(
  fileName: string,
  fileData: Uint8Array
): Promise<string> {
  try {
    // Verificar se OPFS está disponível
    if (!('storage' in navigator && 'getDirectory' in navigator.storage)) {
      throw new Error('OPFS não disponível neste navegador');
    }

    // Solicitar acesso ao OPFS
    const root = await navigator.storage.getDirectory();
    const dirName = 'nostr-chat-files';
    
    // Criar ou obter diretório de arquivos
    let filesDir: FileSystemDirectoryHandle;
    try {
      filesDir = await root.getDirectoryHandle(dirName, { create: true });
    } catch {
      filesDir = await root.getDirectoryHandle(dirName, { create: true });
    }

    // Criar arquivo
    const fileHandle = await filesDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    
    // Escrever dados
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(fileData);
        controller.close();
      }
    });
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
    }
    await writable.close();

    console.log('[FileManager] Arquivo salvo no OPFS:', fileName);
    return fileHandle.name;
  } catch (error) {
    console.error('Erro ao salvar arquivo no OPFS:', error);
    throw error;
  }
}

// Função para carregar arquivo do OPFS
export async function loadFileFromOPFS(fileName: string): Promise<Uint8Array> {
  try {
    const root = await navigator.storage.getDirectory();
    const filesDir = await root.getDirectoryHandle('nostr-chat-files');
    const fileHandle = await filesDir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return new Uint8Array(await file.arrayBuffer());
  } catch (error) {
    console.error('Erro ao carregar arquivo do OPFS:', error);
    throw error;
  }
}

// Publicar evento Nostr com retry logic e fallback
async function publishNostrEvent(eventTemplate: any, sk: Uint8Array, retryCount: number = 0): Promise<void> {
  try {
    const event = finalizeEvent(eventTemplate, sk);
    const pool = getPool();
    
    console.log('[FileManager] Publicando evento Nostr:', event.id, 'usando relays:', DEFAULT_RELAYS.length);
    
    // Tenta publicar nos relays principais
    const results = pool.publish(DEFAULT_RELAYS, event);
    
    // Verificar quantos relays aceitaram o evento
    const successfulPublications = await Promise.allSettled(results);
    const successfulCount = successfulPublications.filter(r => r.status === 'fulfilled').length;
    
    console.log(`[FileManager] Evento publicado em ${successfulCount}/${DEFAULT_RELAYS.length} relays`);
    
    // Se falhou em todos os relays principais, tentar fallback
    if (successfulCount === 0 && retryCount === 0) {
      console.log('[FileManager] Tentando fallback com relays alternativos...');
      await publishNostrEvent(eventTemplate, sk, 1);
      return;
    }
    
    // Se falhou em todos os relays incluindo fallback, lançar erro
    if (successfulCount === 0) {
      throw new Error('Todos os relays bloquearam o evento');
    }
    
    console.log('[FileManager] Evento publicado com sucesso:', event.id);
  } catch (error) {
    console.error('Erro ao publicar evento Nostr:', error);
    
    // Se for um erro de "blocked" e tiver retry disponível, tentar fallback
    if (error.message.includes('blocked') && retryCount === 0) {
      console.log('[FileManager] Relays principais bloquearam, tentando fallback...');
      try {
        const event = finalizeEvent(eventTemplate, sk);
        const pool = getPool();
        
        const fallbackResults = pool.publish(FALLBACK_RELAYS, event);
        await Promise.allSettled(fallbackResults);
        
        console.log('[FileManager] Evento publicado em fallback relays');
        return;
      } catch (fallbackError) {
        console.error('Fallback também falhou:', fallbackError);
        throw error;
      }
    }
    
    throw error;
  }
}

// Funções auxiliares
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

async function createFileChunkDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NostrFileChunks', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('fileChunks')) {
        const store = db.createObjectStore('fileChunks', { keyPath: 'id', autoIncrement: true });
        store.createIndex('fileKey', 'fileKey');
        store.createIndex('index', 'index');
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Ouvir eventos Nostr e processar chunks
export function setupFileChunkListener(
  onFileReceived: (fileKey: string, metadata: FileMetadata) => void
): () => void {
  console.log('[FileManager] Configurando listener para eventos de arquivo');
  
  const pool = getPool();
  
  // Filtrar eventos de arquivo
  const fileFilters = [
    { kinds: [1061], '#t': ['file-metadata'] }, // Metadata
    { kinds: [1062], '#t': ['file-chunk'] }   // Chunks
  ];

  const subscriptions = fileFilters.map(filter => 
    pool.subscribe(DEFAULT_RELAYS, filter, {
      onevent(event) {
        try {
          if (event.kind === 1061) {
            // Evento de metadata
            const metadata: FileMetadata = JSON.parse(event.content);
            console.log('[FileManager] Metadata recebida:', metadata.name);
            const fileTag = event.tags.find((tag: any) => tag[0] === 'f');
            if (fileTag && fileTag[1]) {
              onFileReceived(fileTag[1], metadata);
            }
          } else if (event.kind === 1062) {
            // Evento de chunk
            const chunkData: FileChunk = JSON.parse(event.content);
            console.log('[FileManager] Chunk recebido:', chunkData.index + 1, '/', chunkData.total);
            
            // Armazenar chunk no IndexedDB para reconstrução posterior
            storeChunkInDB(chunkData, event).catch(console.error);
          }
        } catch (error) {
          console.warn('Falha ao processar evento Nostr:', error);
        }
      },
      oneose() {
        console.log('[FileManager] Conexão com relay encerrada');
      }
    })
  );

  // Função de limpeza
  return () => {
    console.log('[FileManager] Removendo listener de eventos');
    subscriptions.forEach(sub => sub.close());
    if (pool) {
      pool.close(DEFAULT_RELAYS);
    }
  };
}

async function storeChunkInDB(chunkData: FileChunk, event: any): Promise<void> {
  const db = await createFileChunkDB();
  const chunksStore = db.transaction('fileChunks', 'readwrite').objectStore('fileChunks');
  
  // Buscar metadata associada
  const fileKey = chunkData.fileKey;
  const metadataFilter = { kinds: [1061], '#f': [fileKey] };
  const pool = getPool();
  
  try {
    const metadataEvents: any[] = [];
    const metadataSub = pool.subscribeMany(DEFAULT_RELAYS, metadataFilter, {
      onevent(event) {
        metadataEvents.push(event);
      },
      oneose() {
        // Fim da subscrição
      }
    });
    
    // Aguardar um pouco para coletar eventos
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const metadata = metadataEvents.length > 0 ? JSON.parse(metadataEvents[0].content) : null;
    
    const addRequest = chunksStore.add({
      fileKey,
      index: chunkData.index,
      total: chunkData.total,
      data: chunkData.chunk,
      metadata,
      receivedAt: Date.now()
    });
    
    await new Promise((resolve, reject) => {
      addRequest.onsuccess = () => resolve(null);
      addRequest.onerror = () => reject(addRequest.error);
    });
    
    console.log('[FileManager] Chunk armazenado no IndexedDB:', chunkData.index + 1, '/', chunkData.total);
  } catch (error) {
    console.error('Erro ao armazenar chunk:', error);
  }
}