# P2P CDN Livestream

Transmissão de vídeo ao vivo diretamente no navegador, usando **eventos Nostr nativos** (kinds 1990–1993) com **malha de relays P2P** para distribuir os frames sem sobrecarregar o transmissor.

Inspirado no [P2P-CDN](https://github.com/Peer-to-Peer-CDN/P2P-CDN), substituindo o BitTorrent DHT e o mediator centralizado por **eventos Nostr e uma malha de relays entre espectadores**.

---

## Tecnologias

### Eventos Nostr nativos (kinds 1990–1993)

| Kind | Nome | Descrição |
|---|---|---|
| `1990` | `p2p-meta` | Metadados da stream (título, broadcaster, live/offline) |
| `1991` | `p2p-frame` | Dados do frame (WebP/JPEG em base64) |
| `1992` | `p2p-relay-announce` | Anúncio de relay — espectador que re-publica frames |
| `1993` | `p2p-relay-peer` | (reservado) |

### Malha de relays

Para evitar sobrecarregar o transmissor, espectadores com boa conexão tornam-se **relays** automaticamente:

```
Broadcaster                             Viewer A (relay)                  Viewer B
    |                                        |                                |
    |--- Nostr kind 1991 (frame 1) --------->|                                |
    |--- Nostr kind 1991 (frame 2) --------->|                                |
    |                                        |--- kind 1992 ("sou relay") --->|
    |                                        |--- kind 1991 republish ------->|  (recebe de A, não do broadcaster)
    |--- Nostr kind 1991 (frame 3) --------->|                                |
    |                                        |--- kind 1991 republish ------->|
```

- **Broadcaster** publica cada frame como evento Nostr kind 1991.
- **Viewers** assinam os frames do broadcaster.
- **Relays** (viewers que optam por retransmitir) re-publicam os frames recebidos como eventos kind 1991 sob sua própria chave.
- **Novos espectadores** descobrem relays via eventos kind 1992 e podem assinar tanto o broadcaster quanto os relays.
- Quanto mais espectadores, mais relays potenciais — a carga se distribui.

### Canvas + MediaStream API

- `getUserMedia` captura a câmera.
- Um `canvas` 160×120 captura frames e os converte para WebP via `canvas.toBlob`.
- O broadcaster publica o frame como evento Nostr kind 1991.
- O espectador recebe eventos kind 1991 do broadcaster ou de relays, decodifica com `createImageBitmap` e desenha em um canvas.

---

## Fluxo

```
Broadcaster                          Viewer A (relay)              Viewer B
    |                                     |                            |
    |--- kind 1990 (meta: live) --------->|                            |
    |--- kind 1991 (frame 1) ------------>|                            |
    |--- kind 1991 (frame 2) ------------>|                            |
    |                                     |--- kind 1992 (relay) ----->|
    |                                     |                            |--- subscribe kind 1991 (authors: [A])
    |--- kind 1991 (frame 3) ------------>|                            |
    |                                     |--- kind 1991 (frame 3) --->|  (recebe via relay A)
```

---

## Como executar

### 1. Instalar dependências

```bash
cd gun-browser/examples/p2p-cdn-livestream
npm install
```

### 2. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:3000`.

### 3. Transmitir

1. Clique em **"Iniciar Transmissão"**.
2. Conceda permissão de câmera.
3. Confira ou edite os relays Nostr na tela inicial.
4. Um ID único de stream é gerado automaticamente — compartilhe com os espectadores.

### 4. Assistir

1. Em outra aba/outro navegador/outra máquina, cole o ID da stream no campo **"Assistir"**.
2. Use pelo menos um dos mesmos relays Nostr do broadcaster.
3. Clique em **"Assistir"**.
4. O espectador assina eventos Nostr kind 1991 do broadcaster e de relays e os frames ao vivo começam a aparecer.
5. Ative **"Permitir que meu navegador atue como relay"** para ajudar a distribuir os frames.

> **Nota**: Para transmitir câmera, use `localhost` ou HTTPS. Em IP local com HTTP, alguns navegadores bloqueiam `getUserMedia`.

---

## Diferenças da versão anterior (Garfo)

| Aspecto | Antes (Garfo) | Agora (Nostr nativo + relay mesh) |
|---|---|---|
| **Transporte de frames** | Garfo `.put()`/`.on()` via Nostr | Eventos Nostr kind 1991 diretos |
| **Descoberta** | Grafo Garfo | Eventos Nostr kind 1990 (meta) |
| **Distribuição** | Todos do broadcaster | Broadcaster + relays (kind 1992) |
| **Sobrecarga do transmissor** | Alta (todos recebem dele) | Baixa (relays distribuem) |
| **Dependência Garfo** | Sim | Não (apenas Nostr-tools) |
| **Escalabilidade** | Limitada pelo broadcaster | Distribuída pelos relays |

---

## Considerações

- A aplicação é um **protótipo** demonstrando o conceito de P2P CDN com Nostr.
- A qualidade e taxa de quadros dependem dos limites dos relays Nostr e do tamanho dos eventos.
- Para produção, seria necessário:
  - Suporte a codecs de vídeo reais (H.264/webm via MediaRecorder + MediaSource).
  - Segmentação dos frames em chunks menores.
  - WebRTC data channels para relays diretos entre peers (simple-peer).
  - Compressão adaptativa baseada no tamanho aceito pelos relays.
