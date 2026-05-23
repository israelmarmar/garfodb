// Book is a replacement for JS objects, maps, dictionaries.
// A BTree-like structure with radix-tree pages for sorted key-value storage.

export interface BookEntry {
  word: string;
  is: any;
  page?: BookPage;
  text?: string;
  substring: (i?: number, j?: number) => string;
  toString: () => string;
}

export interface BookPage {
  from: any; // string | BookEntry[]
  size: number;
  first: string;
  limbo?: BookEntry[] | null;
  book: BookInstance;
  get: (word: string) => any;
  read: (each?: (x: any) => any) => any[];
  substring: (i?: number, j?: number) => string;
  toString: () => string;
  saving?: boolean;
}

export interface BookInstance {
  (word: string, is?: any): BookInstance;
  all: Record<string, BookEntry>;
  list: BookPage[];
  page: (word: string) => BookPage;
  set: (word: string, is: any) => BookInstance;
  get: (word: string) => any;
  parse?: (text: string) => string;
  split?: (next: BookPage, prev: BookPage) => void;
  PAGE?: number;
}

const DEFAULT_PAGE_SIZE = 2 ** 12;

// ---- Encoding / Decoding ----

export const BookCodec = {
  encode(d: any, s: string = '|', u: string = String.fromCharCode(32)): string {
    switch (typeof d) {
      case 'string': {
        let i = d.indexOf(s);
        let c = 0;
        while (i !== -1) { c++; i = d.indexOf(s, i + 1); }
        return (c ? s + c : '') + '"' + d;
      }
      case 'number': return (d < 0) ? '' + d : '+' + d;
      case 'boolean': return d ? '+' : '-';
      case 'object': {
        if (!d) return ' ';
        const keys = Object.keys(d).sort();
        let t = s;
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          t += u + BookCodec.encode(k, s, u) + u + BookCodec.encode(d[k], s, u) + u + s;
        }
        return t;
      }
      default: return '';
    }
  },

  decode(t: string, s: string = '|'): any {
    if (typeof t !== 'string') return undefined;
    switch (t) {
      case ' ': return null;
      case '-': return false;
      case '+': return true;
    }
    switch (t[0]) {
      case '-': case '+': return parseFloat(t);
      case '"': return t.slice(1);
    }
    return t.slice(t.indexOf('"') + 1);
  }
};

// ---- Slot / Heal utilities ----

function slot(t: string): string[] {
  return heal(t.substring(1, t.length - 1).split(t[0]), t[0]);
}
(BookCodec as any).slot = slot;

function heal(list: string[], sep: string): string[] {
  const i = list.indexOf('');
  if (i < 0) return list;
  if (list[0] === '' && list.length === 1) return [];
  const e = i + 2 + parseInt(list[i + 1].substring(0, list[i + 1].indexOf('"')) || list[i + 1]);
  if (e !== e) return [];
  list[i] = list.slice(i, e).join(sep || '|');
  return list.slice(0, i + 1).concat(heal(list.slice(e), sep));
}

// ---- Page management ----

function spot(
  word: string,
  sorted: any[],
  parse?: (t: any) => string
): number {
  const parser = parse || ((t: any) => String(t));
  let min = 0;
  const w = '' + word;
  let max = sorted.length;
  let i = max / 2;

  while (i !== min) {
    const idx = i >> 0;
    const curr = (parser(sorted[idx]) || '').substring(0);
    if (w < curr || w === curr) {
      max = idx;
    } else {
      min = idx + 1;
    }
    i = min + (max - min) / 2;
  }
  return i;
}

function fromPage(page: BookPage): any[] {
  if (typeof page.from !== 'string') return page.from;
  const list = slot(page.from);
  page.from = list;
  return list;
}

function sortPage(page: BookPage, limbo?: BookEntry[]): any[] {
  const from = (typeof page.from === 'string') ? slot(page.from) : (page.from || []);
  (page as any).from = from;

  if (!limbo && !page.limbo) return from;
  const l: any[] = limbo || page.limbo || [];
  (page as any).limbo = null;

  // mix limbo entries into from
  for (let j = 0; j < l.length; j++) {
    const entry = l[j];
    const pos = spot(entry.word, from, BookCodec.decode);
    from.splice(pos, 0, entry);
    entry.page = page;
  }

  from.sort((a: any, b: any) => {
    const aw = typeof a === 'string' ? a : a.word || BookCodec.decode('' + a) || '';
    const bw = typeof b === 'string' ? b : b.word || BookCodec.decode('' + b) || '';
    return aw < bw ? -1 : 1;
  });
  return from;
}

function splitPage(page: BookPage, book: BookInstance): void {
  const list = sortPage(page);
  const mid = list.length / 2 >> 0;
  const half = list[mid];

  const next: BookPage = {
    first: half.substring(0),
    size: 0,
    from: [],
    substring: sub,
    toString: to,
    book: book,
    get: book.get,
    read: listRead,
  };

  const nextFrom: any[] = next.from;
  for (let i = mid; i < list.length; i++) {
    const entry = list[i];
    nextFrom.push(entry);
    next.size += (entry.is || '').length || 1;
    entry.page = next;
  }

  page.from = page.from.slice(0, mid);
  page.size -= next.size;

  book.list.splice(spot(half.substring(), book.list) + 1, 0, next);

  if (book.split) {
    book.split(next, page);
  }
}

// ---- Text serialization ----

function pageText(page: BookPage): string {
  if (page.limbo) sortPage(page);
  return (typeof page.from === 'string') ? page.from : '|' + (page.from as BookEntry[]).join('|') + '|';
}

function to(this: any): string {
  return this.text || (this.text = pageText(this));
}

function sub(this: any, i?: number, j?: number): string {
  const val = this.first || this.word || (BookCodec.decode((fromPage(this) || [])[0]) || '') || '';
  if (i === undefined) return String(val).substring(0);
  return String(val).substring(i, j);
}

function subt(this: any, i?: number, j?: number): string {
  return this.word;
}

function tot(this: BookEntry): string {
  return this.text = this.text || ':' + BookCodec.encode(this.word) + ':' + BookCodec.encode(this.is) + ':';
}

function listRead(this: BookPage, each?: (x: any) => any): any[] {
  const fn = each || ((x: any) => x);
  const list = sortPage(this);
  const results: any[] = [];
  for (let i = 0; i < list.length; i++) {
    const w = list[i];
    const word = (w.word || (this.book.parse ? this.book.parse(w) : w) || '');
    results.push(fn(this.book.get(word)));
  }
  return results;
}

function sizeOf(t: any): number {
  return (t || '').length || 1;
}

// ---- Book creation ----

export function createBook(text?: string, pageSize?: number): BookInstance {
  const createPage = (first?: string): BookPage => ({
    first: '',
    size: 0,
    from: first || '',
    substring: sub,
    toString: to,
    book: null as any,
    get: null as any,
    read: listRead,
  });

  const b = function b(word: string, is?: any): BookInstance {
    const self = b as any;
    const has = self.all[word];
    if (is === undefined) {
      return (has && has.is) || self.get(has || word);
    }
    if (has) {
      const p = has.page;
      if (p) {
        p.size += sizeOf(is) - sizeOf(has.is);
        p.text = '';
      }
      has.text = '';
      has.is = is;
      return self;
    }
    return self.set(word, is);
  } as any as BookInstance;

  const firstPage: BookPage = createPage(text || '');
  firstPage.size = (text || '').length;
  firstPage.book = b;
  firstPage.get = b.get;

  b.list = [firstPage];
  b.page = page;
  b.set = set;
  b.get = get;
  b.all = {};
  b.PAGE = pageSize || DEFAULT_PAGE_SIZE;

  return b;
}

// ---- Instance methods ----

function page(this: BookInstance, word: string): BookPage {
  const list = this.list;
  const i = spot(word, list, this.parse as any);
  let p = list[i];

  if (typeof p === 'string') {
    list[i] = p = {
      size: -1,
      first: this.parse ? this.parse(p) : p,
      from: [],
      substring: sub,
      toString: to,
      book: this,
      get: this.get,
      read: listRead,
    } as any;
  }

  return p;
}

function get(this: BookInstance, word: string): any {
  if (!word) return undefined;
  if ((word as any).is !== undefined) return (word as any).is;

  const has = this.all[word];
  if (has) return has.is;

  const p = this.page(word);
  if (!p || !p.from) return undefined;

  // search in the page
  const list = fromPage(p);
  if (!list) return undefined;

  let i = spot(word, list, BookCodec.decode);
  let entry = list[i];

  if (entry && word === getWord(entry)) {
    return (this.all[word] = entry as any).is;
  }

  // check next slot too
  if (typeof entry !== 'string') {
    i += 1;
    entry = list[i];
  }
  if (entry && word === getWord(entry)) {
    return (this.all[word] = entry as any).is;
  }

  // check via slot decoding
  const a = slotCode(entry as string);
  if (word !== BookCodec.decode(a[0])) {
    i += 1;
    entry = list[i];
    const a2 = slotCode(entry as string);
    if (word !== BookCodec.decode(a2[0])) {
      return undefined;
    }
    const decoded: BookEntry = {
      word: '' + word,
      is: BookCodec.decode(a2[1]),
      page: p,
      substring: subt,
      toString: tot,
    };
    (this.all[word] = decoded);
    list[i] = decoded as any;
    return decoded.is;
  }

  const decoded: BookEntry = {
    word: '' + word,
    is: BookCodec.decode(a[1]),
    page: p,
    substring: subt,
    toString: tot,
  };
  (this.all[word] = decoded);
  list[i] = decoded as any;
  return decoded.is;
}

function set(this: BookInstance, word: string, is: any): BookInstance {
  const has = this.all[word];
  if (has) {
    this(word, is);
    return this;
  }

  const w = '' + word;
  const p = this.page(w);

  if (p && p.from) {
    this.get(w);
    if (this.all[w]) {
      this(w, is);
      return this;
    }
  }

  const entry: BookEntry = {
    word: w,
    is: is,
    page: p,
    substring: subt,
    toString: tot,
  };

  this.all[w] = entry;
  p.first = (p.first < w) ? p.first : w;

  if (!p.limbo) p.limbo = [];
  p.limbo.push(entry);

  this(w, is);
  p.size += sizeOf(w) + sizeOf(is);

  if ((this.PAGE || DEFAULT_PAGE_SIZE) < p.size) {
    splitPage(p, this);
  }

  return this;
}

// ---- Helpers ----

function getWord(entry: any): string {
  if (typeof entry === 'string') return BookCodec.decode(entry.split('"')[1] || '');
  return (entry as BookEntry).word || '';
}

function slotCode(t: string): string[] {
  if (!t || typeof t !== 'string') return ['', ''];
  const firstSep = t.indexOf('"');
  if (firstSep === -1) return [t, ''];
  const key = t.slice(0, firstSep + 1);
  const val = t.slice(firstSep + 1);
  return [BookCodec.decode(key), BookCodec.decode(val)];
}
