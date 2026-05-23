import { SEA } from './root.js';

export async function certify(who: any, policy: any, authority: any, cb?: any, opt?: any): Promise<any> {
  if (cb) {
    return certify(who, policy, authority, opt).then(function (result: any) {
      cb(null, result);
    }, function (err: any) {
      cb(err);
    });
  }

  const cert: any = {};
  cert.c = who;
  if (policy.expiry) cert.e = policy.expiry;
  if (policy.read) cert.r = policy.read;
  if (policy.write) cert.w = policy.write;
  if (policy.blockRead) cert.rb = policy.blockRead;
  if (policy.blockWrite) cert.wb = policy.blockWrite;

  const json = JSON.stringify(cert);
  const sig = await SEA.sign(json, authority);
  return sig;
}

SEA.certify = certify;

export default certify;
