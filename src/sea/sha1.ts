import { api as shim } from './shim.js';

export async function sha1(data: any): Promise<any> {
  const subtle = shim.subtle;
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await subtle.digest({ name: 'SHA-1' }, dataBytes);
  return shim.Buffer.from(hash);
}

export default sha1;
