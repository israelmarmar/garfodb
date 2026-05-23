import { SEA } from './root.js';
import { api as shim } from './shim.js';
import { work } from './work.js';
import { sign } from './sign.js';
import { verify } from './verify.js';
import { encrypt } from './encrypt.js';
import { decrypt } from './decrypt.js';
import { certify } from './certify.js';
import { pair } from './pair.js';
import { sha1 } from './sha1.js';
import { SafeBuffer } from './buffer.js';

SEA.work = work;
SEA.sign = sign;
SEA.verify = verify;
SEA.encrypt = encrypt;
SEA.decrypt = decrypt;
SEA.certify = certify;
SEA.pair = pair;
SEA.name = pair;

SEA.random = SEA.random || shim.random;
SEA.Buffer = SEA.Buffer || SafeBuffer;

SEA.keyid = SEA.keyid || (async (pub: string) => {
  try {
    const pb = shim.Buffer.concat(
      pub.replace(/-/g, '+').replace(/_/g, '/').split('.')
        .map((t: string) => shim.Buffer.from(t, 'base64'))
    );
    const id = shim.Buffer.concat([
      shim.Buffer.from([0x99, pb.length / 0x100, pb.length % 0x100]), pb,
    ]);
    const sha1Hash = await sha1(id);
    const hash = shim.Buffer.from(sha1Hash, 'binary');
    return hash.toString('hex', hash.length - 8);
  } catch (e) {
    console.log(e);
    throw e;
  }
});

const win: any = SEA.window;
if (win && win.GUN) {
  win.GUN.SEA = SEA;
}

export { SEA };
export default SEA;
