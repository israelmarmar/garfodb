/** A connected peer */
export interface Peer {
  id?: string;
  url?: string;
  wire?: any;
  pid?: string;
  last?: string;
  batch?: any;
  tail?: number;
  queue?: any[];
  retry?: number;
  tried?: number;
  defer?: any;
  met?: number;
  say?: (raw: string) => void;
  bye?: () => void;
  [key: string]: any;
}

/** Peer options stored in the opt.peers map */
export interface PeerEntry {
  id?: string;
  url?: string;
  pid?: string;
  [key: string]: any;
}
