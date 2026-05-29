import { useCallback, useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { DEFAULT_NOSTR_RELAYS, P2PCDNStream, ViewerInfo } from './p2p-cdn';

type Mode = 'broadcast' | 'watch' | null;

function App() {
  const [mode, setMode] = useState<Mode>(null);
  const [streamId, setStreamId] = useState(() => Math.random().toString(36).slice(2, 10));
  const [watchId, setWatchId] = useState('');
  const [connected, setConnected] = useState(false);
  const [isRelay, setIsRelay] = useState(false);
  const [relayDepth, setRelayDepth] = useState(0);
  const [log, setLog] = useState<string[]>(['📡 P2P CDN Livestream (Garfo + WebRTC)', 'Escolha um modo para começar.']);
  const [title, setTitle] = useState('');
  const [streamMetaTitle, setStreamMetaTitle] = useState('');
  const [viewers, setViewers] = useState<ViewerInfo[]>([]);
  const [peerCount, setPeerCount] = useState(0);

  const streamRef = useRef<P2PCDNStream | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const logRef = useRef<HTMLPreElement>(null);

  const viewerPeersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const viewerPeerRef = useRef<SimplePeer.Instance | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev, msg]);
  }, []);

  const getRelays = useCallback(() => DEFAULT_NOSTR_RELAYS, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  /* ─── Broadcast ─── */

  const startBroadcast = useCallback(async () => {
    const sid = streamId;
    setMode('broadcast');
    setViewers([]);
    setPeerCount(0);

    try {
      const el = await waitForVideoElement(videoRef);
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = ms;
      el.srcObject = ms;
      await el.play();
      await waitForVideoReady(el);
    } catch (e: any) {
      setMode(null);
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
      addLog('Erro ao acessar câmera/microfone: ' + e.message);
      return;
    }

    const relays = getRelays();
    const stream = new P2PCDNStream(sid, { title, relays });
    streamRef.current = stream;
    stream.onStatus = addLog;
    stream.onViewerListChange = (list) => setViewers(list);

    // When a viewer announces, create a SimplePeer connection to them
    stream.onViewerAnnounce = (viewerPubkey: string) => {
      if (viewerPeersRef.current.has(viewerPubkey)) return;
      if (viewerPubkey === stream.pubkey) return;
      addLog('🔌 Criando conexão WebRTC com ' + viewerPubkey.slice(0, 12) + '...');

      const peer = new SimplePeer({
        initiator: true,
        stream: mediaStreamRef.current!,
        trickle: true,
      });

      peer.on('signal', (signalData: any) => {
        streamRef.current?.sendSignal(viewerPubkey, signalData.type, signalData);
      });

      peer.on('connect', () => {
        addLog('✅ WebRTC conectado: ' + viewerPubkey.slice(0, 12) + '...');
        setPeerCount(prev => prev + 1);
      });

      peer.on('close', () => {
        addLog('🔌 WebRTC desconectado: ' + viewerPubkey.slice(0, 12) + '...');
        viewerPeersRef.current.delete(viewerPubkey);
        setPeerCount(prev => Math.max(0, prev - 1));
      });

      peer.on('error', (err: Error) => {
        addLog('⚠️ WebRTC error: ' + err.message);
        viewerPeersRef.current.delete(viewerPubkey);
        setPeerCount(prev => Math.max(0, prev - 1));
      });

      viewerPeersRef.current.set(viewerPubkey, peer);
    };

    // Handle incoming WebRTC signals (answers, ICE from viewers)
    stream.onWebRTCSignal = (signalData: any, fromPubkey: string) => {
      if (fromPubkey === stream.pubkey) return;
      const peer = viewerPeersRef.current.get(fromPubkey);
      if (peer) {
        try { peer.signal(signalData); } catch (e: any) {
          addLog('⚠️ Erro no sinal WebRTC: ' + (e?.message || e));
        }
      }
    };

    await stream.startBroadcast();
    addLog('🔗 Compartilhe o ID: ' + sid);
    addLog('📹 Transmitindo ao vivo via WebRTC + Garfo');
  }, [streamId, title, getRelays, addLog]);

  const stopBroadcast = useCallback(() => {
    setMode(null);
    for (const peer of viewerPeersRef.current.values()) {
      try { peer.destroy(); } catch (_) {}
    }
    viewerPeersRef.current.clear();
    setPeerCount(0);

    streamRef.current?.destroy();
    streamRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    setViewers([]);
    addLog('🛑 Transmissão encerrada.');
  }, [addLog]);

  /* ─── Watch ─── */

  const startWatching = useCallback(async () => {
    const sid = watchId.trim();
    if (!sid) { addLog('⚠️ Digite um ID de stream válido.'); return; }

    const relays = getRelays();
    const stream = new P2PCDNStream(sid, { relays });
    streamRef.current = stream;
    stream.onStatus = addLog;
    setMode('watch');
    setConnected(false);
    setIsRelay(false);
    setRelayDepth(0);
    setViewers([]);

    // Handle incoming WebRTC offers from broadcaster/relay
    stream.onWebRTCSignal = (signalData: any, fromPubkey: string) => {
      if (fromPubkey === stream.pubkey) return;

      if (!viewerPeerRef.current && signalData.type === 'offer') {
        addLog('🔌 Recebendo oferta WebRTC de ' + fromPubkey.slice(0, 12) + '...');

        const peer = new SimplePeer({ initiator: false, trickle: true });

        peer.on('signal', (answerData: any) => {
          streamRef.current?.sendSignal(fromPubkey, answerData.type, answerData);
        });

        peer.on('stream', (remoteStream: MediaStream) => {
          addLog('🎬 Stream recebido via WebRTC!');
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
          }
          setConnected(true);
        });

        peer.on('connect', () => {
          addLog('✅ WebRTC conectado ao ' + (fromPubkey === stream.pubkey ? 'broadcaster' : 'relay'));
        });

        peer.on('close', () => {
          addLog('🔌 WebRTC desconectado');
          setConnected(false);
          if (videoRef.current) videoRef.current.srcObject = null;
          viewerPeerRef.current = null;
        });

        peer.on('error', (err: Error) => {
          addLog('⚠️ WebRTC error: ' + err.message);
          setConnected(false);
          viewerPeerRef.current = null;
        });

        viewerPeerRef.current = peer;
      }

      if (viewerPeerRef.current) {
        try {
          viewerPeerRef.current.signal(signalData);
        } catch (e: any) {
          addLog('⚠️ Erro no sinal WebRTC: ' + (e?.message || e));
        }
      }
    };

    stream.onMetaChange = (meta) => {
      if (meta) {
        setStreamMetaTitle(meta.title);
        if (!meta.live) {
          addLog('⏹️ Stream encerrado pelo broadcaster.');
        }
      }
    };

    // Poll relay status
    const checkRelay = setInterval(() => {
      if (!streamRef.current) { clearInterval(checkRelay); return; }
      setIsRelay(streamRef.current.isRelay);
      setRelayDepth(streamRef.current.relayDepth);
    }, 1000);

    await stream.startWatching();
  }, [watchId, getRelays, addLog]);

  const stopWatching = useCallback(() => {
    setMode(null);
    if (viewerPeerRef.current) {
      try { viewerPeerRef.current.destroy(); } catch (_) {}
      viewerPeerRef.current = null;
    }
    streamRef.current?.destroy();
    streamRef.current = null;
    setConnected(false);
    setIsRelay(false);
    setRelayDepth(0);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    addLog('⏹ Visualização encerrada.');
  }, [addLog]);

  /* ─── Render ─── */

  return (
    <div id="app">
      <header>
        <h1>📡 P2P CDN Livestream</h1>
        <p>Transmissão ao vivo por <strong>WebRTC</strong> com sinalização Garfo (Nostr) e relay tree</p>
      </header>

      {!mode && (
        <div className="panel" id="startPanel">
          <section className="card">
            <h2>🛰️ Relays</h2>
            <p className="relay-list">{DEFAULT_NOSTR_RELAYS.join(', ')}</p>
          </section>
          <section className="card">
            <h2>📹 Transmitir</h2>
            <input type="text" placeholder="Título (opcional)" value={title} onChange={e => setTitle(e.target.value)} />
            <input type="text" placeholder="ID do stream" value={streamId} onChange={e => setStreamId(e.target.value)} />
            <button onClick={startBroadcast}>Iniciar Transmissão</button>
          </section>
          <section className="card">
            <h2>👁 Assistir</h2>
            <input type="text" placeholder="ID do stream" value={watchId} onChange={e => setWatchId(e.target.value)} />
            <button onClick={startWatching}>Assistir</button>
          </section>
        </div>
      )}

      {mode === 'broadcast' && (
        <div className="panel">
          <section className="card">
            <h2>📹 Transmitindo</h2>
            <p>ID: <strong>{streamId}</strong></p>
            <p>WebRTC: <span>{peerCount}</span> conexão(ões)</p>

            {viewers.length > 0 && (
              <div className="viewer-list">
                <h3>👁 Espectadores ({viewers.length})</h3>
                  {viewers.map(v => (
                    <div key={v.pubkey} className={`viewer-item ${v.role === 'relay' ? 'relay' : ''}`}>
                      <span className="viewer-pubkey">{v.pubkey.slice(0, 12)}...</span>
                      <span className="viewer-status">
                        {v.role === 'relay'
                          ? '🔁 Relay (prof. ' + v.relayDepth + ')'
                          : '👁 Assistindo'}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            <video ref={videoRef} autoPlay muted playsInline />
            <button className="danger" onClick={stopBroadcast}>Encerrar</button>
          </section>
        </div>
      )}

      {mode === 'watch' && (
        <div className="panel">
          <section className="card">
            <h2>👁 Assistindo</h2>
            {streamMetaTitle && <p>Stream: <span>{streamMetaTitle}</span></p>}
            <p>Status: <span>{connected ? '🟢 Conectado (WebRTC)' : '🔴 Aguardando sinal...'}</span></p>
            <p>Qualidade: <span>Original (WebRTC)</span></p>
            {isRelay && (
              <p className="relay-badge">
                🔁 Relay ativo (profundidade {relayDepth}) — retransmitindo para novos espectadores
              </p>
            )}
            {!isRelay && connected && (
              <p className="hint">Aguardando designação como relay pelo broadcaster...</p>
            )}
            <video ref={videoRef} autoPlay playsInline controls />
            <button className="danger" onClick={stopWatching}>Parar</button>
          </section>
        </div>
      )}

      <footer>
        <pre ref={logRef} id="log">{log.join('\n')}</pre>
      </footer>
    </div>
  );
}

export default App;

/* ─── Helpers ─── */

function waitForVideoElement(ref: { current: HTMLVideoElement | null }): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function check() {
      if (ref.current) { resolve(ref.current); return; }
      attempts++;
      if (attempts > 30) { reject(new Error('Elemento de vídeo não encontrado.')); return; }
      requestAnimationFrame(check);
    }
    check();
  });
}

function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error('Timeout esperando frame.')); }, 5000);
    function cleanup() { window.clearTimeout(timeout); video.removeEventListener('loadeddata', onReady); video.removeEventListener('canplay', onReady); }
    function onReady() { cleanup(); resolve(); }
    video.addEventListener('loadeddata', onReady, { once: true });
    video.addEventListener('canplay', onReady, { once: true });
  });
}
