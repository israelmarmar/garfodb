---
name: nostr-file-transfer
description: Implementação de envio de arquivos via Nostr com armazenamento OPFS para evitar limites de relay
source: auto-skill
extracted_at: '2026-05-29T17:59:06.409Z'
---

# Envio de Arquivos via Nostr com OPFS

## Descrição
Este skill demonstra como implementar um sistema de envio de arquivos em um aplicativo Nostr que:
- Divide arquivos em chunks menores para evitar estourar limites de relay
- Envia chunks via eventos Nostr customizados
- Armazena arquivos localmente usando OPFS (Open File System)
- Fornece feedback visual durante o processo de upload

## Arquitetura Implementada

### 1. Gerenciamento de Chunks via Nostr
```typescript
// Tipos de eventos customizados
const METADATA_KIND = 1061;  // Para informações do arquivo
const CHUNK_KIND = 1062;     // Para chunks de dados

// Estrutura de metadata
interface FileMetadata {
  name: string;
  mime: string;
  size: number;
  totalChunks: number;
  timestamp: number;
  sender: string;
  recipient: string;
}

// Estrutura de chunk
interface FileChunk {
  chunk: string;
  index: number;
  total: number;
  fileKey: string;
}
```

### 2. Envio de Arquivos
```typescript
export async function sendFileViaNostr(
  file: File,
  recipientPublicKey: string,
  senderPrivateKey: Uint8Array,
  onChunkSent?: (chunkIndex: number, totalChunks: number) => void
): Promise<string> {
  // Dividir arquivo em chunks (24KB cada)
  const CHUNK_SIZE = 24000;
  const fileKey = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  // Converter para base64 e dividir
  const base64 = await fileToBase64(file);
  const chunks = splitIntoChunks(base64, CHUNK_SIZE);
  
  // Enviar metadata primeiro
  await publishNostrEvent({
    kind: METADATA_KIND,
    tags: [['f', fileKey], ['mime', metadata.mime], ...],
    content: JSON.stringify(metadata)
  }, senderPrivateKey);
  
  // Enviar chunks individualmente
  for (let i = 0; i < chunks.length; i++) {
    await publishNostrEvent({
      kind: CHUNK_KIND,
      tags: [['f', fileKey], ['chunk', i.toString()], ...],
      content: JSON.stringify({ chunk: chunks[i], index: i, total: chunks.length, fileKey })
    }, senderPrivateKey);
    
    onChunkSent?.(i + 1, chunks.length);
    await delay(200); // Evitar sobrecarga do relay
  }
  
  return fileKey;
}
```

### 3. Armazenamento OPFS
```typescript
export async function saveFileToOPFS(
  fileName: string,
  fileData: Uint8Array
): Promise<string> {
  // Verificar se OPFS está disponível
  if (!('storage' in navigator && 'getDirectory' in navigator.storage)) {
    throw new Error('OPFS não disponível');
  }

  const root = await navigator.storage.getDirectory();
  const filesDir = await root.getDirectoryHandle('nostr-chat-files', { create: true });
  
  const fileHandle = await filesDir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  
  // Escrever dados usando stream
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
  return fileHandle.name;
}
```

### 4. Recebimento de Arquivos
```typescript
export async function receiveFileFromNostr(
  fileKey: string,
  onChunkReceived?: (chunkIndex: number, totalChunks: number) => void
): Promise<{ dataUrl: string; fileName: string; fileSize: number; fileMime: string }> {
  const pool = getPool();
  
  // Buscar metadata
  const metadataFilter = { kinds: [METADATA_KIND], '#f': [fileKey] };
  const metadataEvents = await pool.query(DEFAULT_RELAYS, metadataFilter);
  const metadata = JSON.parse(metadataEvents[0].content);
  
  // Buscar chunks
  const chunkFilter = { kinds: [CHUNK_KIND], '#f': [fileKey] };
  const chunkEvents = await pool.query(DEFAULT_RELAYS, chunkFilter);
  
  // Processar e ordenar chunks
  const chunks = chunkEvents
    .map(event => JSON.parse(event.content))
    .sort((a, b) => a.index - b.index);
  
  // Reconstruir arquivo
  const base64 = chunks.map(chunk => chunk.chunk).join('');
  
  // Salvar no OPFS
  const fileData = base64ToUint8Array(base64);
  await saveFileToOPFS(fileKey + '_' + metadata.name, fileData);
  
  return {
    dataUrl: `data:${metadata.mime};base64,${base64}`,
    fileName: metadata.name,
    fileSize: metadata.size,
    fileMime: metadata.mime
  };
}
```

### 5. Listener para Eventos de Arquivo
```typescript
export function setupFileChunkListener(
  onFileReceived: (fileKey: string, metadata: FileMetadata) => void
): () => void {
  const pool = getPool();
  
  const subscriptions = [
    // Listener para metadata
    pool.subscribeMany(DEFAULT_RELAYS, {
      kinds: [METADATA_KIND],
      '#t': ['file-metadata']
    }, {
      onevent(event) {
        const metadata = JSON.parse(event.content);
        const fileKey = event.tags.find((tag: any) => tag[0] === 'f')?.[1];
        if (fileKey) onFileReceived(fileKey, metadata);
      }
    }),
    
    // Listener para chunks
    pool.subscribeMany(DEFAULT_RELAYS, {
      kinds: [CHUNK_KIND],
      '#t': ['file-chunk']
    }, {
      onevent(event) {
        const chunkData = JSON.parse(event.content);
        storeChunkInDB(chunkData, event);
      }
    })
  ];
  
  return () => subscriptions.forEach(sub => sub.close());
}
```

## UI Integration

### Feedback Visual durante Upload
```typescript
const [fileUploadProgress, setFileUploadProgress] = useState({
  status: 'idle' | 'uploading' | 'success' | 'error',
  message: '',
  progress: 0
});

// Exemplo de uso no handler de arquivo
setFileUploadProgress({
  status: 'uploading',
  message: `Enviando chunks: ${chunkIndex}/${totalChunks}`,
  progress: Math.round((chunkIndex / totalChunks) * 100)
});
```

### Componente de Progresso
```css
.file-upload-progress {
  background: #2a3942;
  border: 1px solid #3b4a54;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.file-upload-progress .progress-fill {
  height: 100%;
  background: #00a884;
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

## Considerações de Desempenho

### Tamanho dos Chunks
- **24KB por chunk**: Ideal para caber em eventos Nostr
- **Delay de 200ms**: Evita sobrecarga nos relays
- **Múltiplos relays**: Melhora a confiabilidade e velocidade

### Armazenamento OPFS
- **Diretório específico**: `nostr-chat-files`
- **Nomes únicos**: Combinação de fileKey + nome do arquivo
- **Limpeza automática**: Quando possível, remover arquivos temporários

### Otimizações
- **IndexedDB**: Para armazenamento temporário de chunks durante recebimento
- **Cache local**: Evita downloads repetidos dos mesmos arquivos
- **Progresso granular**: Feedback em tempo real do processo

## Integração com Gun DB

```typescript
// Após enviar chunks via Nostr, criar mensagem no chat
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

// Salvar no Gun DB
gun.get(CHAT_PATH).get('all').set(msgData);
gun.get(CHAT_PATH).get('inbox').get(target).set(msgData);
```

Este sistema permite enviar arquivos grandes de forma eficiente, evitando os limites dos relays Nostr enquanto mantém uma experiência de usuário fluida com armazenamento local persistente.