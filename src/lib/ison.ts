declare var require: any;

;(function () {
var yson: any = {}, u;

let counter = 0;
let objStack: any[] = [];
let temp = '';
const limit = 100000;

function StringifyError(this: any, m: any) {
  this.name = 'Error';
  this.message = m;
}

let normalize = (string: any, flagN: any): any => {
  let retStr = '';
  let transform = '';
  let uc =
  '/[\\\'\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4' +
  '\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g';
  let unicode = new RegExp(uc);
  string = string.replace(/\\/gi, '\\\\');
  let escape: any = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
  };
  for(var pattern in escape) {
    var regex = new RegExp(pattern,'gi')
    string = string.replace(regex, escape[pattern])
  }
  unicode.lastIndex = 0;
  if (unicode.test(string)) {
    transform = string.replace(unicode, (a: any) => {
      return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    });
    if (flagN === 1) {
      transform += temp;
      transform += transform;
      temp = '';
      return '"' + transform + '"';
    } else if (flagN === 2) {
      return '"' + transform + '"';
    } else {
      temp += transform;
    }
  } else {
    if (flagN === 1) {
      retStr += temp;
      retStr += string;
      temp = '';
      return '"' + retStr + '"';
    } else if (flagN === 2) {
      return '"' + string + '"';
    } else {
      temp += string;
      return;
    }
  }
};

function * stringifyYield(field: any, container: any, replacer: any, space: any, intensity: any): any {
  let itr = 0;
  let key = '';
  let val: any = '';
  let length = 0;
  let tempVal = '';
  let result: any = '';
  let value = container[field];
  let flag1 = 0;
  let returnStr = '';
  let subStr = '';
  let len = 0;

  if (++counter > 512 * intensity) {
    counter = 0;
    yield val;
  }

  if (typeof replacer === 'function') {
    value = replacer.call(container, field, value);
  }

  switch (typeof value) {
    case 'string':
      if (value.length > limit) {
        for (let l = 0; l < value.length; l += limit) {
          flag1 = 0;
          yield value;
          subStr = value.substr(l, limit);
          len += subStr.length;
          if (len === value.length)
            flag1 = 1;
          returnStr = normalize(subStr, flag1);
        }
      } else
        returnStr = normalize(value, 2);
      return returnStr;
    case 'number':
      return isFinite(value)
        ? String(value)
        : 'null';
    case 'boolean':
    case 'null' as any:
      return String(value);
    case 'undefined':
			return;
		case 'function':
			return 'null';
    case 'object':
      if (!value)
        return 'null';

      let getResult = (decision: any) => {
        if (result.length === 0)
          if (decision)
            return '{}';
          else
          return '[]';
        else
        if (decision)
          if (space)
            return '{\n' + space + result.join(',\n' + space) + '\n' + '}';
          else
            return '{' + result.join(',') + '}';
        else
          if (space)
            return '[\n' + space + result.join(',\n' + space) + '\n' + ']';
          else
            return '[' + result.join(',') + ']';
      };

      result = [];
			if (value && typeof value.toJSON === 'function') {
				const response = value.toJSON(field);
				if (response === undefined) {
					return undefined;
				}

				if (typeof response === "number") {
					result.push(value.toJSON(field));
				} else {
					result.push('"' + value.toJSON(field) + '"');
				}
        if (result.length === 0)
          return '{}';
        else
        if (space)
          return space + result.join(',\n' + space) + '\n';
        else
          return result.join(',');
      }
      if (value && value.constructor === Array) {
        length = value.length;
        for (itr = 0; itr < length; itr += 1) {
          tempVal =
          yield *stringifyYield(itr, value, replacer, space, intensity) ||
          'null';
          if (tempVal !== undefined)
            result.push(tempVal);
        }
        return getResult(false);
      }

      if (replacer && typeof replacer === 'object') {
        length = replacer.length;
        for (itr = 0; itr < length; itr += 1) {
          if (typeof replacer[itr] === 'string') {
            key = replacer[itr];
            val = yield *stringifyYield(key, value, replacer, space, intensity);
            if (val !== undefined)
							result.push(normalize(key, 2) + (space
								? ': '
								: ':') + val);
          }
        }
      } else {
        objStack.push(value);
        for (key in value) {
          if (typeof value[key] === 'object' && value[key] !== null &&
          value[key] !== undefined) {
            if (objStack.indexOf(value[key]) !== -1) {
              return new (StringifyError as any)('Circular Structure Detected');
            } else
            objStack.push(value[key]);
          }
          if (Object.hasOwnProperty.call(value, key)) {
            val = yield *stringifyYield(key, value, replacer, space, intensity);
            if (val !== undefined)
              result.push(normalize(key, 2) + (space
              ? ': '
              : ':') + val);
          }
          objStack = objStack.filter((v: any, i: any, a: any) => { return v !== value[key] });
        }
        objStack = objStack.filter((v: any, i: any, a: any) => { return v !== value });
      }
      return getResult(true);
    default:
      return new (StringifyError as any)('Unexpected Character');
  }
}

let stringifyWrapper = (value: any, replacer: any, space: any, intensity: any, callback: any) => {
  let indent = '';
  if (typeof space === 'number') {
    indent = ' '.repeat(space);
  } else if (typeof space === 'string') {
    indent = space;
  }

  let yielding: any;

  function * yieldBridge() {
    yielding = yield *stringifyYield('', {'': value}, replacer, indent, 1);
  }

  let rs = yieldBridge();
  let g = rs.next();

  let yieldCPU = () => {
    setTimeout(() => {
      g = rs.next();
      if (g && g.done === true) {
        counter = 0;
        temp = ''
        objStack = [];
        if (typeof yielding === 'object')
          return callback(yielding, null);
        else
          return callback(null, yielding);
      }
      yieldCPU();
    }, 0);
  };
  return yieldCPU();
};

let parseWrapper = (text: any, reviver: any, intensity: any, cb: any) => {
  let counter = 0;
  let keyN = 0;
  let parseStr = text;
  let at = 0;
  let ch = ' ';
  let word = '';
  function ParseError(this: any, m: any) {
    this.name = 'ParseError';
    this.message = m;
    this.text = parseStr;
  }

  let seek = () => {
    ch = parseStr.charAt && parseStr.charAt(at);
    at++;
    while (ch && ch <= ' ') {
      seek();
    }
    return ch;
  };

  let unseek = () => {
    ch = parseStr.charAt(--at);
  };

  let wordCheck = () => {
    word = '';
    do {
      word += ch;
      seek();
    } while (ch.match(/[a-z]/i));
    parseStr = parseStr.slice(at - 1);
    at = 0;
    return word;
  };

  let normalizeUnicodedString = () => {
    let inQuotes = ' ';
    let tempIndex = at;
    let index = 0;
    let slash = 0;
    let c = '"';
    while (c) {
      index = parseStr.indexOf('"', tempIndex + 1);
      tempIndex = index;
      ch = parseStr.charAt(tempIndex - 1);
      while (ch === '\\') {
        slash++;
        ch = parseStr.charAt(tempIndex - (slash + 1));
      }
      if (slash % 2 === 0) {
        inQuotes = parseStr.substring(at, index);
        parseStr = parseStr.slice(++index);
        slash = 0;
        break;
      } else
        slash = 0;
    }

    index = inQuotes.indexOf('\\');
    while (index >= 0) {
      let escapee: any = {
        '"': '"',
        '\'': '\'',
        '/': '/',
        '\\': '\\',
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
      };
      let hex = 0;
      let i = 0;
      let uffff = 0;
      at = index;
      ch = inQuotes.charAt(++at);
      if (ch === 'u') {
        uffff = 0;
        for (i = 0; i < 4; i += 1) {
          hex = parseInt(ch = inQuotes.charAt(++at), 16);
          if (!isFinite(hex)) {
            break;
          }
          uffff = uffff * 16 + hex;
        }
        inQuotes = inQuotes.slice(0, index) +
                   String.fromCharCode(uffff) + inQuotes.slice(index + 6);
        at = index;
      } else if (typeof escapee[ch] === 'string') {
        inQuotes = inQuotes.slice(0, index) +
                   escapee[ch] + inQuotes.slice(index + 2);
        at = index + 1;
      } else
        break;
      index = inQuotes.indexOf('\\', at);
    }
    at = 0;
    return inQuotes;
  };

  function * parseYield(): any {
    let key = '';
    let returnObj: any = {};
    let returnArr: any[] = [];
    let v = '';
    let inQuotes = '';
    let num = 0;
    let numHolder = '';
    let addup = () => {
      numHolder += ch;
      seek();
    };
    if (typeof parseStr === 'number' || typeof parseStr === 'boolean' || typeof parseStr === "function" ||
        parseStr === null) {
      parseStr = '';
      return text;
    } else if (typeof parseStr === 'undefined') {
      parseStr = undefined;
      return text;
		} else if (parseStr.charAt && parseStr.charAt(0) === '[' && parseStr.charAt(1) === ']') {
      parseStr = '';
      return [];
    } else if (parseStr.charAt && parseStr.charAt(0) === '{' && parseStr.charAt(1) === '}') {
      parseStr = '';
      return {};
    } else {
      if (++counter > 512 * intensity) {
        counter = 0;
        yield;
      }
      if (keyN !== 1)
        seek();
      switch (ch) {
        case '{':
          seek();
          if ((ch as string) === '}') {
            parseStr = parseStr.slice(at);
            at = 0;
            return returnObj;
          }
          do {
            if ((ch as string) !== '"')
              seek();
            keyN = 1;
            key = yield *parseYield();
            keyN = 0;
            seek();
            returnObj[key] = yield *parseYield();
            seek();
            if ((ch as string) === '}') {
              parseStr = parseStr.slice(at);
              at = 0;
              return returnObj;
            }
          } while ((ch as string) === ',');
          return new (ParseError as any)('Bad object');
        case '[':
          seek();
          if ((ch as string) === ']') {
            parseStr = parseStr.slice(at);
            at = 0;
            return returnArr;
          }
          unseek();
          do {
            v = yield *parseYield();
            returnArr.push(v);
            seek();
            if ((ch as string) === ']') {
              parseStr = parseStr.slice(at);
              at = 0;
              return returnArr;
            }
					} while ((ch as string) === ',');
          return new (ParseError as any)('Bad array');
        case '"':
          parseStr = parseStr.slice(at - 1);
          at = 0;
          if (parseStr.charAt(0) === '"' && parseStr.charAt(1) === '"') {
            parseStr = parseStr.slice(2);
            at = 0;
            return inQuotes;
          } else {
            seek();
            return normalizeUnicodedString();
          }
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '-':
          if ((ch as string) === '-') addup();
          do {
            addup();
            if ((ch as string) === '.' || (ch as string) === 'e' || (ch as string) === 'E' ||
              (ch as string) === '-' || (ch as string) === '+' ||
              ((ch as string) >= String.fromCharCode(65) &&
              (ch as string) <= String.fromCharCode(70)))
              addup();
          } while ((ch as string) === '-' || (ch as string) === '+' || (isFinite(ch as any) && (ch as string) !== ''));
          num = Number(numHolder);
          parseStr = parseStr.slice(at - 1);
          at = 0;
          return num;
        case 't':
          word = wordCheck();
          if (word === 'true')
            return true;
          else return new (ParseError as any)('Unexpected character');
        case 'f':
          word = wordCheck();
          if (word === 'false')
            return false;
          else return new (ParseError as any)('Unexpected character');
        case 'n':
          word = wordCheck();
          if (word === 'null')
            return null;
          else return new (ParseError as any)('Unexpected character');
        default:
          return new (ParseError as any)('Unexpected character');
      }
    }
  }

  let revive = (yieldedObject: any, key: any) => {
    let k = '';
    let v: any = '';
    let val = yieldedObject[key];
    if (val && typeof val === 'object') {
      for (k in val) {
        if (Object.prototype.hasOwnProperty.call(val, k)) {
          v = revive(val, k);
          if (v !== undefined)
            val[k] = v;
          else
            delete val[k];
        }
      }
    }
    return reviver.call(yieldedObject, key, val);
  };

  let yielding: any = '';
  function * yieldBridge() {
    yielding = yield* parseYield();
  }
  let rs = yieldBridge();
  let gen = rs.next();

  let yieldCPU = () => {
    setTimeout(() => {
      gen = rs.next();

      if (gen && gen.done === true) {
        let isEmpty = (value: any) => {
          if (value.charAt(0) === '}' || value.charAt(0) === ']')
            value = value.substring(1, value.length);
          return typeof value === 'string' && !value.trim();
        };
        if (typeof yielding === 'undefined')
          return cb(new (ParseError as any)('Unexpected Character'), null);
        else if (yielding instanceof ParseError)
          return cb(yielding, null);
        else if (!isEmpty(parseStr))
          return cb(new (ParseError as any)('Unexpected Character'), null);
        else {
          if (reviver !== null) {
            if (typeof reviver === 'function') {
              let result = revive({'': yielding}, '');
              return cb(null, result);
            }
          } else
            return cb(null, yielding);
        }
      }
      yieldCPU();
    }, 0);
  };
  return yieldCPU();
};

 let validateSpace = (space: any) => {
  if (typeof space === 'number') {
    space = Math.round(space);
    if (space >= 1 && space <= 10)
      return space;
    else if (space < 1)
      return 0;
    else
      return 10;
  } else {
    if (space.length <= 10)
      return space;
    else
    return space.substr(0, 9);
  }
};

let validateIntensity = (intensity: any) => {
  intensity = Math.round(intensity);
  if (intensity > 0 && intensity <= 32)
    return intensity;
  else if (intensity <= 0)
    return 1;
  else
    return 32;
};

yson.parseAsync = function (data: any, callback: any, reviver: any = null, intensity: any = 1) {
	if (Buffer.isBuffer(data))
		data = data.toString();

	if (!callback)
		throw new Error('Missing Callback');

  intensity = validateIntensity(intensity);
	return parseWrapper(data, reviver, intensity, callback);
};

yson.stringifyAsync = function(data: any, callback: any, replacer: any = null, space: any, intensity: any = 1) {
  if (typeof callback !== 'function') {
    throw new TypeError('Callback is not a function');
  }
  if (typeof space === 'number' || typeof space === 'string')
    space = validateSpace(space);
  if (typeof intensity === 'number')
    intensity = validateIntensity(intensity);
  return stringifyWrapper(data, replacer, space, intensity, callback);
}

if(typeof window != ''+u){ (window as any).YSON = yson }
try{ if(typeof module != ''+u){ module.exports = yson } }catch(e){}
if(typeof JSON != ''+u){
	(JSON as any).parseAsync = yson.parseAsync;
	(JSON as any).stringifyAsync = yson.stringifyAsync;
}

}());
