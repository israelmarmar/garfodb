import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

interface MiningRequest {
  msgId: number;
  unsigned: {
    kind: number;
    pubkey: string;
    created_at: number;
    tags: string[][];
    content: string;
  };
  difficulty: number;
}

self.onmessage = (e: MessageEvent<MiningRequest>) => {
  const { msgId, unsigned, difficulty } = e.data;
  const event: any = { ...unsigned, tags: [...unsigned.tags, ['nonce', '0', String(difficulty)]] };
  let count = 0;
  const enc = new TextEncoder();

  while (true) {
    const now = Math.floor(Date.now() / 1000);
    if (now !== event.created_at) {
      count = 0;
      event.created_at = now;
    }
    event.tags[event.tags.length - 1][1] = String(++count);
    const hash = sha256(enc.encode(JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content])));
    let bits = 0;
    for (const byte of hash) {
      if (byte === 0) bits += 8;
      else { bits += Math.clz32(byte) - 24; break; }
    }
    if (bits >= difficulty) {
      event.id = bytesToHex(hash);
      self.postMessage({ msgId, ...event });
      break;
    }
  }
};
