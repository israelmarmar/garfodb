const { Garfo } = require('../../dist/index.js');
const { setupNostrTransport } = require('../../dist/nostr/index.js');

setupNostrTransport();

const hexSk = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

const gun = new Garfo({ localStorage: false, radisk: false, nostr: { sk: hexSk } });
console.log('[TEST] Garfo created');

// Test put
const g1 = gun.get('test');
g1.put({ msg: 'hello' });
console.log('[TEST] put() called');

// Test set
const g2 = gun.get('test2');
g2.set({ item: 1 });
console.log('[TEST] set() called');

// Give time for async operations
setTimeout(() => {
  console.log('[TEST] Done - no crash');
  // Check the dist to verify out: universe is set
  const fs = require('fs');
  const putDist = fs.readFileSync('/home/israelmarmar/gun-fork/gun-browser/dist/gun/put.js', 'utf8');
  if (putDist.includes('out: root_js_1.universe') || putDist.includes('out: universe')) {
    console.log('[TEST] VERIFIED: out: universe is set in put.js');
  } else {
    console.log('[TEST] FAIL: out: universe NOT found in put.js');
  }
  process.exit(0);
}, 1000);
