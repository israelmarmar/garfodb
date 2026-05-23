import { api as shim } from './shim.js';

export async function sha256(data: any): Promise<any> {
  const subtle = shim.subtle;
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await subtle.digest({ name: 'SHA-256' }, dataBytes);
  return shim.Buffer.from(hash);
}

export default sha256;
