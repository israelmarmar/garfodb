import './base64.js';

const u = undefined;

export class SafeBuffer {
  private data: Uint8Array;

  constructor(data: ArrayLike<number> | ArrayBufferLike | string, enc?: string) {
    if (typeof data === 'string') {
      if (enc === 'base64') {
        const binary = atob(data);
        this.data = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          this.data[i] = binary.charCodeAt(i);
        }
      } else if (enc === 'hex') {
        const bytes: number[] = [];
        for (let i = 0; i < (data as string).length; i += 2) {
          bytes.push(parseInt((data as string).substr(i, 2), 16));
        }
        this.data = new Uint8Array(bytes);
      } else {
        const encoder = new TextEncoder();
        this.data = encoder.encode(data);
      }
    } else {
      this.data = new Uint8Array(data as ArrayBufferLike);
    }
  }

  static from(data: ArrayLike<number> | ArrayBufferLike | string, enc?: string): SafeBuffer {
    return new SafeBuffer(data, enc);
  }

  static alloc(size: number): Uint8Array {
    return new Uint8Array(size);
  }

  static allocUnsafe(size: number): Uint8Array {
    return new Uint8Array(size);
  }

  static concat(list: (SafeBuffer | Uint8Array)[], totalLength?: number): SafeBuffer {
    const buffers = list.map((b) => b instanceof SafeBuffer ? b.data : b);
    const total = totalLength || buffers.reduce((acc, b) => acc + b.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const b of buffers) {
      result.set(b, offset);
      offset += b.length;
    }
    return new SafeBuffer(result);
  }

  get length(): number {
    return this.data.length;
  }

  toString(enc?: string): string {
    if (enc === 'base64') {
      const bytes: number[] = [];
      this.data.forEach((b) => bytes.push(b));
      const binary = String.fromCharCode.apply(null, bytes);
      return btoa(binary);
    }
    if (enc === 'hex') {
      let hex = '';
      this.data.forEach((b) => { hex += ('0' + b.toString(16)).slice(-2); });
      return hex;
    }
    const decoder = new TextDecoder();
    return decoder.decode(this.data);
  }

  toJSON(): string {
    return this.toString('base64');
  }

  slice(start?: number, end?: number): SafeBuffer {
    return new SafeBuffer(this.data.slice(start, end));
  }

  indexOf(val: number, offset?: number): number {
    for (let i = offset || 0; i < this.data.length; i++) {
      if (this.data[i] === val) return i;
    }
    return -1;
  }

  readUInt16BE(offset: number): number {
    return (this.data[offset] << 8) | this.data[offset + 1];
  }

  [Symbol.iterator](): Iterator<number> {
    return this.data[Symbol.iterator]();
  }
}

export default SafeBuffer;
