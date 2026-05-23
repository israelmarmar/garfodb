export class Crypto {
  subtle = globalThis.crypto?.subtle;

  getRandomValues(array: any): any {
    return globalThis.crypto.getRandomValues(array);
  }
}
