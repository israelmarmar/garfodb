import './base64.js';

function SeaArray() {}
Object.assign(SeaArray, { from: Array.from });
(SeaArray as any).prototype = Object.create(Array.prototype);
(SeaArray as any).prototype.toString = function (enc?: any, start?: any, end?: any) {
  enc = enc || 'utf8';
  start = start || 0;
  const length = this.length;
  if (enc === 'hex') {
    const buf = new Uint8Array(this);
    return [...Array(((end && (end + 1)) || length) - start).keys()]
      .map((i: any) => buf[i + start].toString(16).padStart(2, '0')).join('');
  }
  if (enc === 'utf8') {
    return Array.from(
      { length: (end || length) - start },
      (_, i) => String.fromCharCode(this[i + start])
    ).join('');
  }
  if (enc === 'base64') {
    return btoa(this);
  }
};

export { SeaArray };
export default SeaArray;
