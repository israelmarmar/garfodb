declare var Tone: any;
declare var $: any;
declare var require: any;

(function(){
var MODSELF: any, edide: any = {};
edide.global = (function (this: any, edide: any, mod_global: any) {

  return typeof global !== 'undefined' ? global : window;
}).call(MODSELF={}, edide, MODSELF);

edide.set = (function (this: any, edide: any, set: any) {Object.defineProperty(this, 'module_name', {value:'set'});

  set = (...args: any[]) => new Set(args)

  set.addArr = (s: any, arr: any) => {
    var i: any, len: any
    for (i = 0, len = arr.length; i < len; i++) {
      s.add(arr[i])
    }
  }

  set.map = (s: any, func: any) => Array.from(s).map(func)
return set;
}).call(MODSELF={}, edide, MODSELF);

edide.membrameSynth = (function (this: any, edide: any, membrameSynth: any) {Object.defineProperty(this, 'module_name', {value:'membrameSynth'});
  this.startNote = 'A0';

  this.init = () => {
    var bd: any, compressor: any, distortion: any, gain: any, reverb: any;
    distortion = new Tone.Distortion({
      distortion: 0.1,
      oversample: "4x"
    });
    reverb = new Tone.Freeverb(0.75, 1000);
    gain = new Tone.Gain(0.5);
    compressor = new Tone.Compressor({
      ratio: 12,
      threshold: -24,
      release: 0.05,
      attack: 0.003,
      knee: 1
    });
    bd = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: {
        attack: 0.01,
        decay: 0.74,
        sustain: 0.71,
        release: 0.05,
        attackCurve: "exponential"
      }
    });
    bd.chain(gain, distortion, reverb, compressor);
    return [bd, compressor];
  };

return membrameSynth;
}).call(MODSELF={}, edide, MODSELF);

edide.toneSynth = (function (this: any, edide: any, toneSynth: any) {Object.defineProperty(this, 'module_name', {value:'toneSynth'});
  this.startNote = 'C3';

  this.init = () => {
    var ss: any;
    return ss = new Tone.PolySynth(12, Tone.Synth, {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    });
  };

return toneSynth;
}).call(MODSELF={}, edide, MODSELF);

edide.instrumentConfigs = (function (this: any, edide: any, instrumentConfigs: any) {

  var configs: any = {
    'bass-electric': {
      startNote: 'C#2',
      notes: 8,
      step: 3
    },
    'cello': {
      startNote: 'C2',
      notes: 11,
      step: 2,
      skipNotes: edide.set('F#2', 'C4')
    },
    'drum-electric': edide.membrameSynth,
    'guitar-acoustic': {
      startNote:  'D1',
      notes: 26,
      step: 2,
      skipNotes: edide.set('E4', 'F#4', 'G#4', 'A#4', 'C5', 'D5', 'E5')
    },
    'guitar-electric': {
      startNote: 'F#2',
      notes: 15,
      step: 3,
    },
    'piano': {
      startNote: 'A1',
      notes: 30,
      step: 2,
      baseUrl: "https://tonejs.github.io/examples/audio/salamander/"
    },
    'synth-simple': edide.toneSynth,
    'xylophone': {
      startNote: 'G3',
      notes: ['G3', 'C4', 'G4', 'C5', 'G5', 'C6', 'G6', 'C7']
    }
  }

  for (let inst in configs) {
    configs[inst].name = inst
  }
  return configs
}).call(MODSELF={}, edide, MODSELF);

edide.objectFromArray = (function (this: any, edide: any, objectFromArray: any) {
  var identity: any;

  identity = function(el: any) {
    return el;
  };

  return (array: any, valFromEl: any, keyFromEl: any) => {
    var el: any, i: any, ind: any, len: any, obj: any;
    if (valFromEl == null) {
      valFromEl = identity;
    }
    if (keyFromEl == null) {
      keyFromEl = identity;
    }
    obj = {};
    for (ind = i = 0, len = array.length; i < len; ind = ++i) {
      el = array[ind];
      obj[keyFromEl(el, ind)] = valFromEl(el, ind);
    }
    return obj;
  };

}).call(MODSELF={}, edide, MODSELF);

edide.noteFreq = (function (this: any, edide: any, noteFreq: any) {Object.defineProperty(this, 'module_name', {value:'noteFreq'});
  var a4: any, noteMap: any, notesObj: any;

  this.notes = [['C0', 16.35, 2109.89], ['C#0', 17.32, 1991.47], ['D0', 18.35, 1879.69], ['D#0', 19.45, 1774.20], ['E0', 20.60, 1674.62], ['F0', 21.83, 1580.63], ['F#0', 23.12, 1491.91], ['G0', 24.50, 1408.18], ['G#0', 25.96, 1329.14], ['A0', 27.50, 1254.55], ['A#0', 29.14, 1184.13], ['B0', 30.87, 1117.67], ['C1', 32.70, 1054.94], ['C#1', 34.65, 995.73], ['D1', 36.71, 939.85], ['D#1', 38.89, 887.10], ['E1', 41.20, 837.31], ['F1', 43.65, 790.31], ['F#1', 46.25, 745.96], ['G1', 49.00, 704.09], ['G#1', 51.91, 664.57], ['A1', 55.00, 627.27], ['A#1', 58.27, 592.07], ['B1', 61.74, 558.84], ['C2', 65.41, 527.47], ['C#2', 69.30, 497.87], ['D2', 73.42, 469.92], ['D#2', 77.78, 443.55], ['E2', 82.41, 418.65], ['F2', 87.31, 395.16], ['F#2', 92.50, 372.98], ['G2', 98.00, 352.04], ['G#2', 103.83, 332.29], ['A2', 110.00, 313.64], ['A#2', 116.54, 296.03], ['B2', 123.47, 279.42], ['C3', 130.81, 263.74], ['C#3', 138.59, 248.93], ['D3', 146.83, 234.96], ['D#3', 155.56, 221.77], ['E3', 164.81, 209.33], ['F3', 174.61, 197.58], ['F#3', 185.00, 186.49], ['G3', 196.00, 176.02], ['G#3', 207.65, 166.14], ['A3', 220.00, 156.82], ['A#3', 233.08, 148.02], ['B3', 246.94, 139.71], ['C4', 261.63, 131.87], ['C#4', 277.18, 124.47], ['D4', 293.66, 117.48], ['D#4', 311.13, 110.89], ['E4', 329.63, 104.66], ['F4', 349.23, 98.79], ['F#4', 369.99, 93.24], ['G4', 392.00, 88.01], ['G#4', 415.30, 83.07], ['A4', 440.00, 78.41], ['A#4', 466.16, 74.01], ['B4', 493.88, 69.85], ['C5', 523.25, 65.93], ['C#5', 554.37, 62.23], ['D5', 587.33, 58.74], ['D#5', 622.25, 55.44], ['E5', 659.25, 52.33], ['F5', 698.46, 49.39], ['F#5', 739.99, 46.62], ['G5', 783.99, 44.01], ['G#5', 830.61, 41.54], ['A5', 880.00, 39.20], ['A#5', 932.33, 37.00], ['B5', 987.77, 34.93], ['C6', 1046.50, 32.97], ['C#6', 1108.73, 31.12], ['D6', 1174.66, 29.37], ['D#6', 1244.51, 27.72], ['E6', 1318.51, 26.17], ['F6', 1396.91, 24.70], ['F#6', 1479.98, 23.31], ['G6', 1567.98, 22.00], ['G#6', 1661.22, 20.77], ['A6', 1760.00, 19.60], ['A#6', 1864.66, 18.50], ['B6', 1975.53, 17.46], ['C7', 2093.00, 16.48], ['C#7', 2217.46, 15.56], ['D7', 2349.32, 14.69], ['D#7', 2489.02, 13.86], ['E7', 2637.02, 13.09], ['F7', 2793.83, 12.35], ['F#7', 2959.96, 11.66], ['G7', 3135.96, 11.00], ['G#7', 3322.44, 10.38], ['A7', 3520.00, 9.80], ['A#7', 3729.31, 9.25], ['B7', 3951.07, 8.73], ['C8', 4186.01, 8.24]];

  notesObj = null;

  noteMap = () => {
    if (notesObj) {
      return notesObj;
    }
    return notesObj = edide.objectFromArray(this.notes, (val: any, ind: any) => {
      return [ind, ...val];
    }, (key: any) => {
      return key[0];
    });
  };

  this.findNote = (name: any) => {
    return noteMap()[name];
  };

  a4 = this.findNote('A4');

  this.diffToA4 = (name: any) => {
    var note: any;
    note = this.findNote(name);
    return note[0] - a4[0];
  };

  this.diff = (n1: any, n2: any) => {
    return this.findNote(n2)[0] - this.findNote(n1)[0];
  };

return noteFreq;
}).call(MODSELF={}, edide, MODSELF);

edide.strRandom = (function (this: any, edide: any, strRandom: any) {
  return (limit = 20) => {
    return (Math.random() + '').slice(2, +(limit + 1) + 1 || 9e9);
  };

}).call(MODSELF={}, edide, MODSELF);

edide.inEditor = (function (this: any, edide: any, inEditor: any) {Object.defineProperty(this, 'module_name', {value:'inEditor'});
  inEditor = (inEditor === true) || false
return inEditor;
}).call(MODSELF={}, edide, MODSELF);

edide.edideNamespace = (function (this: any, edide: any, edideNamespace: any) {

  return 'edide'
}).call(MODSELF={}, edide, MODSELF);

edide.edideNs = (function (this: any, edide: any, edideNs: any) {
  var base: any, name: any;

  return (base = edide.global)[name = edide.edideNamespace] != null ? base[name] : base[name] = {};

}).call(MODSELF={}, edide, MODSELF);

edide.editorModule = (function (this: any, edide: any, editorModule: any) {
  var editorModule: any;

  editorModule = edide.inEditor ? edide.edideNs : null;

return editorModule;
}).call(MODSELF={}, edide, MODSELF);

edide.keep = (function (this: any, edide: any, keep: any) {Object.defineProperty(this, 'module_name', {value:'keep'});
  var keep: any;

  keep = (prop: any) => {
    return prop;
  };

return keep;
}).call(MODSELF={}, edide, MODSELF);

edide.logProd = (function (this: any, edide: any, logProd: any) {
  return (...args: any[]) => {
    var console: any, ref: any, ref1: any;
    console = (ref = (ref1 = edide.editorModule) != null ? ref1.console : void 0) != null ? ref : edide.global.console;
    return console.log(...args);
  };

}).call(MODSELF={}, edide, MODSELF);

edide.onUnload = (function (this: any, edide: any, onUnload: any) {
  var ref: any, ref1: any;

  return (ref = (ref1 = edide.editorModule) != null ? ref1.unload.add : void 0) != null ? ref : () => {};

}).call(MODSELF={}, edide, MODSELF);

edide.var = (function (this: any, edide: any, mod_var: any) {
  var clearVar: any, currentReact: any, debugging: any, dependees: any, dependsOn: any, depsRequired: any, inInitCall: any, infinityCheck: any, initSetter: any, loopLimit: any, newVar: any, parent: any, setLinks: any, setters: any, updateVar: any, values: any;

  values = edide.keep(new Map);

  setters = edide.keep(new Map);

  dependees = edide.keep(new Map);

  setLinks = edide.keep(new Map);

  debugging = false;

  depsRequired = new Map;

  inInitCall = false;

  dependsOn = new Set();

  initSetter = (name: any, setter: any) => {
    var debugName: any, err: any, parent: any, ref: any, val: any;
    debugName = (ref = setter.type) != null ? ref : name;
    if ((setters.get(name)) != null) {
      throw Error(`Reactive for '${debugName}' already exists`);
    }
    setters.set(name, setter);
    if (inInitCall) {
      throw Error(`can't create reactive setter (for '${debugName}') inside reactive context`);
    }
    inInitCall = name;
    dependsOn.clear();
    try {
      val = setter();
    } catch (error) {
      err = error;
      inInitCall = false;
      err.message = `Reactive initialization of '${debugName}' failed: ${err.message}`;
      throw err;
    }
    parent = null;
    dependsOn.forEach((depName: any) => {
      var deps: any;
      if ((deps = dependees.get(depName)) == null) {
        dependees.set(depName, deps = new Set);
      }
      return deps.add(name);
    });
    inInitCall = false;
    return val;
  };

  loopLimit = 0;

  infinityCheck = new Map;

  parent = null;

  updateVar = function(this: any, name: any, val: any) {
    var ref: any, ref1: any, type: any;
    if (arguments.length === 1) {
      val = setters.get(name)();
      if (debugging && (type = setters.get(name).type)) {
        edide.logProd(`running ${(setters.get(name).type)}`);
      }
    }
    if (typeof name !== 'string') {
      return;
    }
    if (values.get(name) === val && typeof val !== 'object') {
      return;
    }
    if (infinityCheck.get(name) > loopLimit) {
      infinityCheck.forEach((k: any) => {
        return edide.logProd(k);
      });
      edide.logProd(name);
      if ((ref = edide.editorModule) != null) {
        if (typeof ref.reactiveGraph === "function") {
          ref.reactiveGraph();
        }
      }
      throw Error("Infinite loop in \\:var dependencies");
    }
    if (debugging) {
      edide.logProd(`updating ${name}`);
    }
    values.set(name, val);
    if (!inInitCall) {
      infinityCheck.set(name, (infinityCheck.get(name) || 0) + 1);
      if ((ref1 = dependees.get(name)) != null) {
        ref1.forEach((depName: any) => {
          return updateVar(depName);
        });
      }
      infinityCheck.delete(name);
    }
    return val;
  };

  currentReact = [];

  newVar = function(this: any, name: any, setter: any) {
    var context: any, contextSet: any, err: any;
    if (arguments.length === 1) {
      if (typeof name === 'string') {
        if (inInitCall) {
          dependsOn.add(name);
          edide.onUnload(() => {
            return clearVar(name);
          });
        }
        return values.get(name);
      } else {
        setter = name;
        name = Symbol();
        values.set(name, name);
        edide.onUnload(() => {
          return clearVar(name);
        });
      }
    }
    if (currentReact.length) {
      context = currentReact[currentReact.length - 1];
      if (!(contextSet = setLinks.get(context))) {
        setLinks.set(context, contextSet = new Set);
      }
      contextSet.add(name);
    }
    currentReact.push(name);
    if (values.get(name) == null) {
      edide.onUnload(() => {
        return clearVar(name);
      });
    }
    if (typeof setter === 'function') {
      setter = initSetter(name, setter);
    }
    if (typeof name === 'string') {
      try {
        updateVar(name, setter);
      } catch (error) {
        err = error;
        infinityCheck.clear();
        throw err;
      }
    }
    currentReact.pop();
    return setter;
  };

  clearVar = (name: any) => {
    var i: any, len: any, map: any, ref: any;
    ref = [values, setters, dependees, setLinks];
    for (i = 0, len = ref.length; i < len; i++) {
      map = ref[i];
      map.delete(name);
    }
  };

  Object.assign(newVar, {dependees, values, setters, setLinks});

  return newVar;

}).call(MODSELF={}, edide, MODSELF);

edide.reactiveWithFilters = (function (this: any, edide: any, reactiveWithFilters: any) {
  return (initialVars = {} as any, filters = {} as any) => {
    var handler: any, id: any, key: any, react: any, revar: any, todoMap: any, unvar: any, val: any;
    id = edide.strRandom();
    handler = {
      get: (map: any, prop: any) => {
        var ref: any;
        if ((ref = edide.editorModule) != null ? ref.editor_inspector.inspectingNow : void 0) {
          console.log('IN inspector? Find out is it possible to end up here form inside setter');
          return edide.var.values.get(`${id}.${prop}`);
        }
        return edide.var(`${id}.${prop}`);
      },
      set: (map: any, prop: any, value: any) => {
        if ((filters[prop] != null) && !filters[prop](value)) {
          throw Error(`Illegal reactive (${prop}: ${value})`);
        }
        edide.var(`${id}.${prop}`, value);
        return true;
      }
    };
    revar = new Proxy((todoMap = new Map), handler);
    unvar = new Proxy(todoMap, {
      get: (map: any, prop: any) => {
        return edide.var.values.get(`${id}.${prop}`);
      },
      set: (map: any, prop: any, value: any) => {
        return edide.var.values.set(`${id}.${prop}`, value);
      }
    });
    for (key in initialVars) {
      val = initialVars[key];
      revar[key] = val;
    }
    react = (nameOrFunc: any, func: any) => {
      if (func != null) {
        func.type = nameOrFunc;
      } else {
        func = nameOrFunc;
        func.type = 'react';
      }
      return edide.var(func);
    };
    return {
      react,
      revar,
      unvar,
      un: unvar,
      re: revar
    };
  };

}).call(MODSELF={}, edide, MODSELF);

edide.mmState = (function (this: any, edide: any, mmState: any) {Object.defineProperty(this, 'module_name', {value:'mmState'});
  var filters: any, instruments: any;

  this.defaults = {
    playing: false,
    recorderOn: false,
    fullSheet: '',
    sheet: '',
    diffText: '',
    note: null,
    pace: 400,
    bpm: 400,
    beatDelay: (1 / 400) * 60 * 1000,
    balance: 0,
    volume: 0,
    detune: 0,
    blur: 0,
    itch: 0,
    instrumentsLoading: 0,
    instrument: 'guitar-electric',
    scale: 'pentatonic',
    root: 'C3',
    highlight: null,
    keyboardInd: 0
  };

  instruments = Object.keys(edide.instrumentConfigs);

  filters = {
    scale: (val: any) => {
      return ['pentatonic', 'minor', 'major'].includes(val);
    },
    instrument: (val: any) => {
      return instruments.includes(val);
    },
    root: (val: any) => {
      return edide.noteFreq.findNote(val);
    }
  };

  this.react = null;

  this.init = (startingProps = {}) => {
    var props: any;
    if (this.react != null) {
      return this;
    }
    props = Object.assign({}, this.defaults, startingProps);
    ({react: this.react, revar: this.revar, unvar: this.unvar} = edide.reactiveWithFilters(props, filters));
    return this;
  };

return mmState;
}).call(MODSELF={}, edide, MODSELF);

edide.mmEffects = (function (this: any, edide: any, mmEffects: any) {Object.defineProperty(this, 'module_name', {value:'mmEffects'});
  ({revar: this.revar} = edide.mmState.init());

  this.maxLowpass = 10000;

  this.maxDistortion = 3;

  this.revar.lowpass = () => {
    var blur: any;
    ({blur} = this.revar);
    return this.maxLowpass - blur * (this.maxLowpass - 200);
  };

  this.revar.distortion = () => {
    var itch: any;
    ({itch} = this.revar);
    return this.maxDistortion * itch;
  };

return mmEffects;
}).call(MODSELF={}, edide, MODSELF);

edide.clone = (function (this: any, edide: any, clone: any) {
  return (...objects: any[]) => {
    if (Array.isArray(objects[0])) {
      return Object.assign([], ...objects);
    } else {
      return Object.assign({}, ...objects);
    }
  };

}).call(MODSELF={}, edide, MODSELF);

edide.strParsesToNumber = (function (this: any, edide: any, strParsesToNumber: any) {Object.defineProperty(this, 'module_name', {value:'strParsesToNumber'});
  var strParsesToNumber: any;

  strParsesToNumber = (str: any) => {
    return !Number.isNaN(parseInt(str));
  };

return strParsesToNumber;
}).call(MODSELF={}, edide, MODSELF);

edide.mmConfigs = (function (this: any, edide: any, mmConfigs: any) {Object.defineProperty(this, 'module_name', {value:'mmConfigs'});
  var defaultVars: any, mutatingProp: any, mutatingVars: any, stateVars: any, vars: any;

  vars = {};

  mutatingVars = {};

  stateVars = edide.set('itch', 'blur', 'instrument', 'bpm', 'pace', 'beatDelay', 'scale', 'root', 'balance', 'detune', 'volume');

  this.hasVar = (varName: any) => {
    var ref: any, ref1: any;
    return !!((ref = (ref1 = vars[varName]) != null ? ref1 : mutatingVars[varName]) != null ? ref : stateVars.has(varName));
  };

  this.activateVar = (name: any, value: any) => {
    var configs: any;
    if (value != null) {
      configs = stateVars.has(name) ? {
        [`${name}`]: value
      } : mutatingVars[name] != null ? edide.clone(mutatingVars[name]) : void 0;
      if (edide.strParsesToNumber(value)) {
        value = parseFloat(value);
      }
      configs[mutatingProp(configs)] = value;
      return this.activate(configs);
    } else {
      return this.activate(vars[name]);
    }
  };

  mutatingProp = (configs: any) => {
    var name: any, val: any;
    for (name in configs) {
      val = configs[name];
      if (val === '*') {
        return name;
      }
    }
    return false;
  };

  this.activate = (conf: any) => {
    if (conf.name != null) {
      return;
    }
    return Object.assign(edide.mmState.revar, conf);
  };

  this.reset = () => {
    stateVars.forEach((name: any) => {
      return edide.mmState.revar[name] = edide.mmState.defaults[name];
    });
  };

  this.addVar = (varName: any, config: any) => {
    if (mutatingProp(config)) {
      return mutatingVars[varName] = config;
    } else {
      return vars[varName] = config;
    }
  };

  defaultVars = {
    bass: {
      "instrument": "bass-electric"
    },
    cello: {
      "instrument": "cello"
    },
    guitar: {
      "instrument": "guitar-acoustic"
    },
    eguitar: {
      "instrument": "guitar-electric"
    },
    piano: {
      "instrument": "piano"
    },
    synth: {
      "instrument": "synth-simple"
    },
    xylophone: {
      "instrument": "xylophone"
    },
    pentatonic: {
      "scale": "pentatonic"
    },
    major: {
      "scale": "major"
    },
    minor: {
      "scale": "minor"
    }
  };

  this.init = () => {
    var conf: any, name: any;
    vars = {};
    for (name in defaultVars) {
      conf = defaultVars[name];
      this.addVar(name, conf, false);
    }
  };

  this.init();

return mmConfigs;
}).call(MODSELF={}, edide, MODSELF);

edide.setTimeout = (function (this: any, edide: any, mod_setTimeout: any) {
  var nativeSetTimeout: any, ref: any;

  nativeSetTimeout = edide.global.nativeSetTimeout = (ref = edide.global.nativeSetTimeout) != null ? ref : edide.global.setTimeout;

  return function(this: any, arg1: any, arg2: any) {
    var fun: any, id: any, num: any;
    [fun, num] = typeof arg2 === 'function' ? [arg2, arg1] : [arg1, arg2];
    id = nativeSetTimeout(fun, num);
    edide.onUnload(() => {
      return clearTimeout(id);
    });
    return id;
  };

}).call(MODSELF={}, edide, MODSELF);

edide.musicScales = (function (this: any, edide: any, musicScales: any) {Object.defineProperty(this, 'module_name', {value:'musicScales'});
  this.full = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  this.scaleSteps = {
    pentatonic: [
      0,
      3,
      2,
      2,
      3
    ],
    major: [
      0,
      2,
      2,
      1,
      2,
      2,
      2
    ],
    minor: [
      0,
      2,
      1,
      2,
      2,
      1,
      2
    ]
  };

  this.triadSteps = {
    major: [
      0,
      4,
      3
    ],
    minor: [0, 3, 4]
  };

  this.triadCombinations = {
    protagonism: 'M2M',
    outerSpace: 'M6M',
    fantastical: 'M8M',
    sadness: 'M4m',
    romantic: 'M5m',
    wonder: 'm5M',
    mystery: 'm2M',
    dramatic: 'm11M',
    antagonismDanger: 'm6m',
    antagonismEvil: 'm8m'
  };

return musicScales;
}).call(MODSELF={}, edide, MODSELF);

edide.mathOp = (function (this: any, edide: any, mathOp: any) {Object.defineProperty(this, 'module_name', {value:'mathOp'});
  this.sum = function(a: any, b: any) {
    return a + b;
  };

  this.multiply = function(a: any, b: any) {
    return a * b;
  };

return mathOp;
}).call(MODSELF={}, edide, MODSELF);

edide.mmKeyboard = (function (this: any, edide: any, mmKeyboard: any) {Object.defineProperty(this, 'module_name', {value:'mmKeyboard'});
  var A: any, a: any, char: any, chari: any, i: any, j: any, len: any, len1: any, noncaps: any, qwertyChar: any, qwertyRows: any, revar: any, row: any, rowi: any, space: any, unvar: any;

  ({revar, unvar} = edide.mmState.init());

  revar.scaleSteps = () => {
    return edide.musicScales.scaleSteps[revar.scale];
  };

  this.special = {
    rest: '.',
    long: '=',
    comment: '#',
    var: ':',
    confStart: '{',
    confEnd: '}'
  };

  this.specialKeyCodes = new Set(Object.values(this.special).map((s: any) => {
    return s.charCodeAt(0);
  }));

  this.specialChars = new Set(Object.values(this.special));

  this.isPauseKey = (keyCode: any) => {
    return this.specialKeyCodes.has(keyCode);
  };

  this.isSpecialChar = (char: any) => {
    return this.specialChars.has(char);
  };

  this.isPauseChar = this.isSpecialChar;

  this.keyboards = ['qwerty', 'abc'];

  a = 'a'.charCodeAt(0);

  A = 'A'.charCodeAt(0);

  space = ' '.charCodeAt(0);

  this.isCaps = (key: any) => {
    return A <= key && key < a;
  };

  this.capsDiff = a - A;

  noncaps = (key: any) => {
    if (this.isCaps(key)) {
      return key + this.capsDiff;
    } else {
      return key;
    }
  };

  this.getNoteInd = (key: any) => {
    var maxInstrumentNoteInd: any, noteBaseInd: any, noteInd: any, notes: any, startNote: any, step: any;
    ({startNote, notes, step} = unvar.instrumentConf);
    startNote = unvar.root;
    noteBaseInd = edide.noteFreq.findNote(startNote)[0];
    noteInd = this[this.keyboards[unvar.keyboardInd]](noncaps(key), noteBaseInd);
    maxInstrumentNoteInd = noteBaseInd + notes * step;
    while (noteInd > maxInstrumentNoteInd) {
      noteInd -= 2 * 12;
    }
    return noteInd;
  };

  this.abc = (key: any, baseInd: any) => {
    var fromLowest: any, noteInd: any, stepsFromClosestOctave: any;
    fromLowest = key - a;
    stepsFromClosestOctave = fromLowest % revar.scaleSteps.length;
    noteInd = 0;
    noteInd += revar.scaleSteps.slice(0, +stepsFromClosestOctave + 1 || 9e9).reduce(edide.mathOp.sum);
    noteInd += 12 * Math.floor(fromLowest / revar.scaleSteps.length);
    return baseInd + noteInd;
  };

  qwertyRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

  qwertyChar = {};

  for (rowi = i = 0, len = qwertyRows.length; i < len; rowi = ++i) {
    row = qwertyRows[rowi];
    for (chari = j = 0, len1 = row.length; j < len1; chari = ++j) {
      char = row[chari];
      qwertyChar[char.charCodeAt(0)] = [rowi, chari];
    }
  }

  this.qwerty = (key: any, baseInd: any) => {
    var charSteps: any, halfSteps: any, noteInd: any, octave: any, rowchar: any;
    if (!(rowchar = qwertyChar[key])) {
      return;
    }
    [row, char] = rowchar;
    octave = qwertyRows.length - 1 - row + Math.floor(char / unvar.scaleSteps.length);
    char = char % revar.scaleSteps.length;
    charSteps = revar.scaleSteps.slice(0, +char + 1 || 9e9).reduce((a: any, b: any) => {
      return a + b;
    });
    halfSteps = 12 * octave + charSteps;
    return noteInd = baseInd + halfSteps;
  };

return mmKeyboard;
}).call(MODSELF={}, edide, MODSELF);

edide.chars = (function (this: any, edide: any, chars: any) {Object.defineProperty(this, 'module_name', {value:'chars'});
  this.space = ' ';

  this.nonBreakingSpace = ' ';

  this.enter = "\n";

return chars;
}).call(MODSELF={}, edide, MODSELF);

edide.showError = (function (this: any, edide: any, showError: any) {
  var error: any;

  error = (err: any) => {
    if (edide.inEditor) {
      return edide.editorModule.editor_error.show(err);
    } else if (typeof edide.global.require === 'object' && (edide.global[edide.edideNamespace].prodErrorPrinter != null)) {
      return edide.global[edide.edideNamespace].prodErrorPrinter.showError(err);
    } else {
      return console.error(err);
    }
  };

  return (err: any) => {
    var err2: any;
    if (err != null ? err.stack : void 0) {
      return error(err);
    } else {
      try {
        throw Error(err);
      } catch (error1) {
        err2 = error1;
        return error(err2);
      }
    }
  };
}).call(MODSELF={}, edide, MODSELF);

edide.mmParserSpecial = (function (this: any, edide: any, mmParserSpecial: any) {Object.defineProperty(this, 'module_name', {value:'mmParserSpecial'});
  this.config = (trackStr: any, ts = {} as any) => {
    var endInd: any, err: any, name: any;
    endInd = trackStr.search('}') || trackStr.length;
    try {
      ts.conf = JSON.parse(trackStr.slice(0, +endInd + 1 || 9e9));
      if (ts.conf.name != null) {
        ({name} = ts.conf);
        delete ts.conf.name;
        edide.mmConfigs.addVar(name, ts.conf);
      } else {
        edide.mmConfigs.activate(ts.conf);
      }
    } catch (error) {
      err = error;
      ts.skip = true;
      edide.showError(err);
    }
    return endInd;
  };

  this.var = (track: any, trackState: any) => {
    var err: any, i: any, value: any, varLength: any, varName: any, varStr: any;
    ({i} = trackState);
    varLength = track.slice(i + 1).indexOf(edide.mmKeyboard.special.var);
    if (varLength === -1) {
      return false;
    }
    varStr = track.slice(i + 1, +(i + varLength) + 1 || 9e9);
    [varName, value] = varStr.split(' ');
    if (!edide.mmConfigs.hasVar(varName)) {
      return false;
    }
    try {
      edide.mmConfigs.activateVar(varName, value);
      trackState.i += varLength + 2;
      return true;
    } catch (error) {
      err = error;
      return false;
    }
  };

return mmParserSpecial;
}).call(MODSELF={}, edide, MODSELF);

edide.mmNote = (function (this: any, edide: any, mmNote: any) {Object.defineProperty(this, 'module_name', {value:'mmNote'});
  this.fromChar = (char: any) => {
    return this.fromKeyCode(char.charCodeAt(0));
  };

  this.fromKeyCode = (key: any) => {
    var noteInd: any, ref: any;
    if (typeof (noteInd = edide.mmKeyboard.getNoteInd(key)) === 'number') {
      return (ref = edide.noteFreq.notes[noteInd]) != null ? ref[0] : void 0;
    }
  };

return mmNote;
}).call(MODSELF={}, edide, MODSELF);

edide.mmParser = (function (this: any, edide: any, mmParser: any) {Object.defineProperty(this, 'module_name', {value:'mmParser'});
  var getNoteLength: any, nonBreakingSpace: any, processTrack: any, revar: any, space: any, unvar: any;

  ({revar, unvar} = edide.mmState);

  getNoteLength = (row: any, noteInd: any) => {
    var char: any, length: any;
    length = 1;
    while (char = row[++noteInd]) {
      if (char === edide.mmKeyboard.special.long) {
        length++;
      } else {
        break;
      }
    }
    return length;
  };

  ({space, nonBreakingSpace} = edide.chars);

  processTrack = (track: any, ccs: any, ts: any) => {
    var bef: any, chord: any, groupingChars: any, keyCode: any, lastSpace: any, note: any, repeat: any, repeatStart: any;
    if (!track[ts.i]) {
      return;
    }
    if (ts.skip) {
      return;
    }
    switch (track[ts.i]) {
      case '{':
        return ts.i += edide.mmParserSpecial.config(track.slice(ts.i), ts);
      case '*':
        if (ts.repeat != null) {
          ts.repeat--;
          if (ts.repeat > 0) {
            ts.i = ts.iStart = ts.repeatStart;
          } else {
            ts.repeat = ts.repeatStart = null;
            ts.i++;
          }
        } else {
          if (isNaN(repeat = parseInt(track.slice(ts.i + 1)))) {
            ts.i++;
          } else {
            ts.repeat = repeat - 1;
            bef = track.slice(0, ts.i);
            groupingChars = ['(', space, nonBreakingSpace, '*'];
            lastSpace = Math.max(...groupingChars.map((c: any) => {
              return bef.lastIndexOf(c);
            }));
            repeatStart = lastSpace !== -1 ? lastSpace + 1 : 0;
            ts.i = ts.iStart = ts.repeatStart = repeatStart;
          }
        }
        return processTrack(track, ccs, ts);
      case '[':
        ccs.chord = [];
        ts.i++;
        return processTrack(track, ccs, ts);
      case ']':
        ts.i++;
        ({chord} = ccs);
        if (!chord) {
          return processTrack(track, ccs, ts);
        }
        ccs.chord = null;
        if (chord.length) {
          if (!unvar.preprocessing) {
            revar.playNote = [chord, getNoteLength(track, ts.i)];
          }
          ccs.played = true;
        } else {
          processTrack(track, ccs, ts);
        }
        return;
      case edide.mmKeyboard.special.var:
        if (edide.mmParserSpecial.var(track, ts)) {
          processTrack(track, ccs, ts);
        } else {
          ts.skip = true;
        }
        return;
      case edide.mmKeyboard.special.comment:
        return ts.skip = true;
    }
    if (!(keyCode = track.charCodeAt(ts.i))) {
      return;
    }
    ts.i++;
    if (note = edide.mmNote.fromKeyCode(keyCode)) {
      if (ccs.chord) {
        ccs.chord.push(note);
        processTrack(track, ccs, ts);
      } else {
        if (!unvar.preprocessing) {
          revar.playNote = [note, getNoteLength(track, ts.i)];
        }
        ccs.played = true;
      }
    } else if (edide.mmKeyboard.isPauseKey(keyCode)) {
      ccs.played = true;
    } else {
      processTrack(track, ccs, ts);
    }
  };

  this.splitSections = (str: any) => {
    var i: any, j: any, prevInd: any, ref: any, row: any, section: any, sections: any;
    str = str.replace('&\n', '');
    sections = [];
    section = null;
    row = 0;
    prevInd = 0;
    for (i = j = 0, ref = str.length; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
      if (!(str[i] === '\n' || i === str.length)) {
        continue;
      }
      if (str[i - 1] === '\n') {
        if (section != null) {
          sections.push(section);
        }
        section = null;
      }
      if (i > prevInd) {
        if (section == null) {
          section = {
            row: row,
            tracks: []
          };
        }
        section.tracks.push(str.slice(prevInd, i));
      }
      row++;
      prevInd = i + 1;
    }
    if (section != null) {
      sections.push(section);
    }
    sections.row = 0;
    return sections;
  };

  this.play = (song: any, sectionInd: any, trackStates: any) => {
    var ccs: any, section: any;
    if (!unvar.playing) {
      return;
    }
    revar.highlight = null;
    sectionInd = sectionInd || 0;
    if (typeof song === 'string') {
      song = this.splitSections(song);
    }
    section = song[sectionInd];
    if (!section) {
      if (!unvar.preprocessing) {
        revar.playing = false;
      }
      return;
    }
    if (!Array.isArray(trackStates)) {
      trackStates = section.tracks.map(() => {
        return {
          i: 0
        };
      });
    }
    ccs = {};
    section.tracks.forEach((track: any, tInd: any) => {
      var conf: any, i: any, iStart: any;
      if (conf = trackStates[tInd].conf) {
        return edide.mmConfigs.activate(conf);
      } else {
        trackStates[tInd].iStart = trackStates[tInd].i;
        processTrack(track, ccs, trackStates[tInd]);
        ({iStart, i} = trackStates[tInd]);
        if (i > iStart) {
          return revar.highlight = [section.row + tInd, iStart, i - 1];
        }
      }
    });
    if (ccs.played) {
      if (unvar.preprocessing) {
        this.play(song, sectionInd, trackStates);
      } else {
        edide.setTimeout(() => {
          return this.play(song, sectionInd, trackStates);
        }, unvar.beatDelay);
      }
    } else {
      this.play(song, sectionInd + 1);
    }
  };

return mmParser;
}).call(MODSELF={}, edide, MODSELF);

edide.moduleGate = (function (this: any, edide: any, moduleGate: any) {Object.defineProperty(this, 'module_name', {value:'moduleGate'});
  if (!edide.inEditor) {
    return this;
  }

  this.root;

  this.rootName;

  this.active;

  this.activeName;

  this.executing;

  this.executingName;

return moduleGate;
}).call(MODSELF={}, edide, MODSELF);

edide.rejectIfRecompiled = (function (this: any, edide: any, rejectIfRecompiled: any) {
  if (!edide.inEditor) {
    return () => {};
  }

  return (promise: any) => {
    var recompiled: any, rootName: any;
    ({rootName} = edide.moduleGate);
    recompiled = false;
    edide.editorModule.editor_events.on('before_recompile', () => {
      return recompiled = true;
    });
    return promise.then(function(arg: any) {
      if (recompiled || rootName !== edide.moduleGate.rootName) {
        return Promise.reject();
      } else {
        return arg;
      }
    });
  };
}).call(MODSELF={}, edide, MODSELF);

edide.promise = (function (this: any, edide: any, promise: any) {Object.defineProperty(this, 'module_name', {value:'promise'});
  var localPromise: any, ref: any;

  localPromise = edide.global.origPromise = (ref = edide.global.origPromise) != null ? ref : edide.global.Promise;

  this.new = function(cb: any) {
    if (edide.inEditor) {
      return edide.rejectIfRecompiled(new Promise(cb));
    } else {
      return new Promise(cb);
    }
  };

  this.all = function(cbArray: any) {
    if (edide.inEditor) {
      return edide.rejectIfRecompiled(Promise.all(cbArray));
    } else {
      return Promise.all(cbArray);
    }
  };

  this.resolve = Promise.resolve.bind(Promise);

  this.reject = Promise.reject.bind(Promise);

return promise;
}).call(MODSELF={}, edide, MODSELF);

edide.qs = (function (this: any, edide: any, qs: any) {
  return (selector: any, el = document) => {
    return el.querySelector(selector);
  };

}).call(MODSELF={}, edide, MODSELF);

edide.scriptContainer = (function (this: any, edide: any, scriptContainer: any) {
  var createContainer: any, ref: any;

  createContainer = () => {
    var s: any;
    s = document.createElement('div');
    s.id = 'scripts';
    return s;
  };
  return (ref = edide.qs('#scripts')) != null ? ref : document.body.appendChild(createContainer());

}).call(MODSELF={}, edide, MODSELF);

edide.scriptAdd = (function (this: any, edide: any, scriptAdd: any) {
  return (src: any, cb: any) => {
    var el: any;
    el = document.createElement('script');
    edide.scriptContainer.appendChild(el);
    if (cb) {
      el.onload = cb;
    }
    el.type = 'application/javascript';
    el.src = src;
  };

}).call(MODSELF={}, edide, MODSELF);

edide.requireScript = (function (this: any, edide: any, requireScript: any) {
  var base: any;

  if ((base = edide.global).requireScriptPromises == null) {
    base.requireScriptPromises = new Map;
  }

  return (scriptSrc: any) => {
    var promise: any;
    if (promise = base.requireScriptPromises.get(scriptSrc)) {
      return promise;
    } else {
      base.requireScriptPromises.set(scriptSrc, promise = edide.promise.new((resolve: any) => {
        return edide.scriptAdd(scriptSrc, resolve);
      }));
      return promise.catch((err: any) => {
        edide.showError(err);
        return base.requireScriptPromises.delete(scriptSrc);
      });
    }
  };
}).call(MODSELF={}, edide, MODSELF);

edide.mmPipe = (function (this: any, edide: any, mmPipe: any) {Object.defineProperty(this, 'module_name', {value:'mmPipe'});
  var dist: any, lowpass: any, panner: any, react: any, revar: any, reverber: any, unvar: any;

  ({revar, unvar, react} = edide.mmState.init());

  dist = lowpass = reverber = panner = null;

  this.initPipe = () => {
    lowpass = new Tone.Filter(unvar.lowpass, 'lowpass', -12);
    dist = new Tone.Distortion(unvar.distortion);
    panner = new Tone.Panner();
    panner.connect(dist);
    dist.connect(lowpass);
    lowpass.toMaster();
    this.output = lowpass;
    revar.pipeReady = true;
    return edide.onUnload(() => {
      if (dist != null) {
        if (typeof dist.dispose === "function") {
          dist.dispose();
        }
      }
      if (lowpass != null) {
        if (typeof lowpass.dispose === "function") {
          lowpass.dispose();
        }
      }
      return panner != null ? typeof panner.dispose === "function" ? panner.dispose() : void 0 : void 0;
    });
  };

  this.initInstrument = (instrument: any) => {
    instrument.connect(panner);
    edide.onUnload(() => {
      return instrument != null ? instrument.disconnect() : void 0;
    });
    return instrument;
  };

  revar.panner = () => {
    return revar.balance;
  };

  react('panner', () => {
    revar.panner;
    return panner != null ? panner.pan.value = revar.panner : void 0;
  });

  react('pipe distortion', () => {
    var ref: any;
    revar.distortion;
    revar.lowpass;
    if (dist != null) {
      dist.distortion = revar.distortion;
    }
    return lowpass != null ? (ref = lowpass.frequency) != null ? ref.linearRampTo(revar.lowpass, 0) : void 0 : void 0;
  });

return mmPipe;
}).call(MODSELF={}, edide, MODSELF);

edide.mmInstruments = (function (this: any, edide: any, mmInstruments: any) {Object.defineProperty(this, 'module_name', {value:'mmInstruments'});

  var defaultUrl = 'https://nbrosowsky.github.io/tonejs-instruments/samples/'

  var { revar, unvar, react } = edide.mmState

  var defaultInstrument = 'electric-guitar'

  this.initInstrument = async (resolve: any) => {
    await edide.requireScript('https://cdnjs.cloudflare.com/ajax/libs/tone/13.8.9/Tone.js')
    edide.mmPipe.initPipe()
  }

  var instrumentCache = edide.keep({})

  this.createNew = () => {

    var {name} = unvar.instrumentConf
    var instrument: any, endOfPipe: any
    var instrumentConf = this.instruments[name]

    if (instrumentConf.module_name) {
      var res = instrumentConf.init()
      if (Array.isArray(res)) {
        instrument = res[0]
        endOfPipe = res[1]
      } else {
        instrument = endOfPipe = res
      }
    } else if (instrumentCache[name]) {
      instrument = endOfPipe = instrumentCache[name]
    } else {
      var noteFiles = buildNotes(instrumentConf)
      revar.instrumentsLoading++
      var inst = new Tone.Sampler(noteFiles, {
        "release" : 1,
        "baseUrl" : instrumentConf.url || defaultUrl + name + '/',
        "onload"  : () => revar.instrumentsLoading--
      })
      inst.soundFontInstrument = true
      instrument = endOfPipe = instrumentCache[name] = inst
    }

    edide.mmPipe.initInstrument(endOfPipe)

    return instrument
  }

  this.isReady = () => {
    var { current } = this
    return current && (typeof current.loaded == 'undefined' || current.loaded === true)
  }

  function buildNotes({startNote, notes, step, skipNotes}: any) {
    var [startInd] = edide.noteFreq.findNote(startNote)
    var noteFiles: any = {}
    if (Array.isArray(notes)) {
      notes.forEach((note: any) => {
        noteFiles[note] = note.replace('#','s') + '.[mp3|ogg]'
      })
    } else {
      for (let i=0; i < notes*step; i+=step) {
        let note = edide.noteFreq.notes[startInd + i][0];
        if (skipNotes && skipNotes.has(note))
          continue
        noteFiles[note] = note.replace('#','s') + '.[mp3|ogg]'
      }
    }
    return noteFiles
  }

  this.instruments = edide.instrumentConfigs

  this.instrumentList = Object.values(this.instruments)

  react('active instrument config', () => {
    revar.instrumentConf = this.instruments[revar.instrument]
  })

return mmInstruments;
}).call(MODSELF={}, edide, MODSELF);

edide.cloneSibling = (function (this: any, edide: any, cloneSibling: any) {
  return (srcObj: any) => {
    var o: any;
    o = Object.create(Object.getPrototypeOf(srcObj));
    Object.assign(o, srcObj);
    return o;
  };

}).call(MODSELF={}, edide, MODSELF);

edide.times = (function (this: any, edide: any, times: any) {
  return (timesNum: any, action: any) => {
    while (timesNum-- > 0) {
      action(timesNum + 1);
    }
  };

}).call(MODSELF={}, edide, MODSELF);

edide.sleep = (function (this: any, edide: any, sleep: any) {
  var sleep: any;

  sleep = (ms: any) => {
    var resolve: any, timeout: any;
    timeout = resolve = null;
    return edide.promise.new((res: any) => {
      resolve = res;
      return timeout = edide.setTimeout(ms, res);
    });
  };

  return sleep;

}).call(MODSELF={}, edide, MODSELF);

edide.mmInstrument = (function (this: any, edide: any, mmInstrument: any) {Object.defineProperty(this, 'module_name', {value:'mmInstrument'});
  var cloneOrCreateInstrument: any, getInstruments: any, instruments: any, play: any, react: any, revar: any, unvar: any, updateVolAndTune: any;

  instruments = {};

  ({unvar, revar, react} = edide.mmState);

  revar.bpm = () => {
    return revar.pace;
  };

  revar.beatDelay = () => {
    return (1 / revar.bpm) * 60 * 1000;
  };

  react(() => {});

  updateVolAndTune = (inst: any) => {
    var detune: any, volume: any;
    ({volume, detune} = unvar);
    if ((detune != null) && (inst.detune != null)) {
      inst.set("detune", detune);
    }
    if ((volume != null) && (inst.volume != null)) {
      return inst.set("volume", volume);
    }
  };

  react(() => {
    var inst: any, insts: any, j: any, len: any, name: any;
    revar.volume;
    revar.detune;
    for (name in instruments) {
      insts = instruments[name];
      for (j = 0, len = insts.length; j < len; j++) {
        inst = insts[j];
        updateVolAndTune(inst);
      }
    }
  });

  react('create first instrument', () => {
    var name: any, ref: any;
    if (!(name = (ref = revar.instrumentConf) != null ? ref.name : void 0)) {
      return edide.showError(`Unknown instrument: ${unvar.instrument}`);
    }
    if (revar.pipeReady && !instruments[name]) {
      return instruments[name] = [edide.mmInstruments.createNew()];
    }
  });

  cloneOrCreateInstrument = (name: any) => {
    var inst: any;
    inst = instruments[name][0].soundFontInstrument ? (inst = edide.cloneSibling(instruments[name][0]), inst.isPlaying = false, inst) : edide.mmInstruments.createNew();
    updateVolAndTune(inst);
    return inst;
  };

  getInstruments = (n: any) => {
    var all: any, free: any, name: any;
    ({name} = unvar.instrumentConf);
    all = instruments[name];
    free = all.filter((i: any) => {
      return !i.isPlaying;
    });
    edide.times(n - free.length, () => {
      var inst: any;
      free.push(inst = cloneOrCreateInstrument(name));
      return all.push(inst);
    });
    return free.slice(0, n);
  };

  this.playChord = (chord: any, noteLength = 1) => {};

  this.playNote = (chord: any, noteLength = 1) => {
    var ind: any, inst: any, insts: any, j: any, len: any, ref: any;
    if (!Array.isArray(chord)) {
      chord = [chord];
    }
    ref = insts = getInstruments(chord.length);
    for (ind = j = 0, len = ref.length; j < len; ind = ++j) {
      inst = ref[ind];
      play(inst, chord[ind], noteLength);
    }
  };

  play = async(instrument: any, note: any, length: any) => {
    var err: any;
    instrument.isPlaying = note;
    try {
      instrument.triggerAttackRelease(note, (length * unvar.beatDelay) / 1000);
    } catch (error) {
      err = error;
      err.message = `Error in playing note ${note}, '${unvar.instrumentConf.name}' probably not loaded yet`;
      edide.showError(err);
    }
    revar.note = note;
    await edide.sleep(unvar.nextDelay);
    return instrument.isPlaying = false;
  };

return mmInstrument;
}).call(MODSELF={}, edide, MODSELF);

edide.mmPlayer = (function (this: any, edide: any, mmPlayer: any) {Object.defineProperty(this, 'module_name', {value:'mmPlayer'});
  var react: any, revar: any, unvar: any;

  ({revar, unvar, react} = edide.mmState.init());

  this.play = (str: any) => {
    revar.sheet = str;
    return revar.playing = true;
  };

  react('play from sheet', () => {
    if (!revar.playing) {
      return;
    }
    edide.mmConfigs.init();
    revar.preprocessing = true;
    return edide.setTimeout(() => {
      edide.mmParser.play(unvar.sheet);
      return revar.preprocessing = 'done';
    });
  });

  react('play notes/chords', () => {
    var chord: any, playNote: any, playing: any, preprocessing: any, time: any;
    ({playNote, playing, preprocessing} = revar);
    if (!(playNote && playing && preprocessing === false)) {
      return;
    }
    [chord, time] = revar.playNote;
    return edide.mmInstrument.playNote(chord, time);
  });

  this.toggle = () => {
    return revar.playing = !unvar.playing;
  };

  revar.instrumentsLoading;

  react('play after preprocess', () => {
    var instrumentsLoading: any, preprocessing: any;
    ({instrumentsLoading, preprocessing} = revar);
    if (!(preprocessing === 'done' && instrumentsLoading === 0)) {
      return;
    }
    unvar.preprocessing = false;
    edide.mmConfigs.reset();
    return edide.mmParser.play(unvar.sheet);
  });

return mmPlayer;
}).call(MODSELF={}, edide, MODSELF);

edide.waves = (function (this: any, edide: any, waves: any) {Object.defineProperty(this, 'module_name', {value:'waves'});

  edide.global.music = this

  edide.mmEffects

  var { revar, unvar, react } = edide.mmState

  var playQueue: any = []

  this.play = (str: any) => {
    if (!unvar.pipeReady) return playQueue.push(str)
    revar.playing = true

    edide.mmPlayer.play(str)
  }

  this.stop = () => revar.playing = false

  edide.mmInstruments.initInstrument()

  react(() => {
    if(!revar.pipeReady) return
    edide.mmConfigs.reset()
    this.play(playQueue.join("\n\n"))
  })
return waves;
}).call(MODSELF={}, edide, MODSELF);

edide.wave = (function (this: any, edide: any, wave: any) {

  var parent: any = {
    play: function(){
      edide.waves.play(this.sheet)
      return this
    },
    stop: function(){
      edide.waves.stop(this.sheet)
      return this
    },
    blur: function(val: any){
      this.sheet = `:blur ${val}:` + this.sheet
      return this
    },
    itch: function(val: any){
      this.sheet = `:itch ${val}:` + this.sheet
      return this
    },
    long: function(val: any){
      this.sheet = `:beatDelay ${val*1000}:` + this.sheet
      return this
    },
    pace: function(val: any) {
      this.sheet = `:pace ${val}:` + this.sheet
      return this
    },
    vary: function(val: any){
      this.sheet = `:detune ${val}:` + this.sheet
      return this
    },
    loud: function(val: any){
      this.sheet = `:volume ${val}:` + this.sheet
      return this
    },
    balance: function(val: any){
      this.sheet = `:balance ${val}:` + this.sheet
      return this
    }
  }

  return edide.global.wave = (str: any) => {
    edide.mmConfigs.reset()
    var obj = Object.create(parent)
    obj.sheet = str
    return obj
  }

}).call(MODSELF={}, edide, MODSELF);
edide.global.wave = edide.wave;
})();
