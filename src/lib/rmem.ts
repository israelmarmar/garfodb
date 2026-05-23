export function createRmem(): any {
  const store: Record<string, any> = {};
  const u = undefined;

  return {
    put(file: string, data: any, cb: (err: any, ok?: number) => void): void {
      store[file] = data;
      cb(null, 1);
    },
    get(file: string, cb: (err: any, data?: any) => void): void {
      const tmp = store[file] || u;
      cb(null, tmp);
    },
  };
}

export default createRmem;
