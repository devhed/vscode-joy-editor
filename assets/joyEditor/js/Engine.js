/* eslint linebreak-style: ["off", "unix"] */
/* eslint func-names: ["error", "never"] */
/* eslint-env jquery */
/* global document */

// Joy Engine

const Brief = new function () {
  // state variable
  const dictionary = {};
  let errors = [];
  let results = [];
  let context = { Stack: [] };
  const defines = {};
  let displayConsole = [];

  function assertStack(length) {
    if (context.Stack.length < length) {
      errors.push('Stack underflow!');
    }
  }

  // error display functions
  this.pushError = function (errorText) {
    errors.push(errorText);
  };
  this.getErrors = function () {
    return errors;
  };
  this.clearErrors = function () {
    errors = [];
  };

  // result display from execution of '.' command
  this.pushResult = function (result) {
    results.push(result);
  };
  this.getResults = function () {
    return results;
  };
  this.clearResults = function () {
    results = [];
  };

  // display console, contains all results and console joy functions like 'putchars'
  this.concatDisplayConsole = function (displayText) {
    displayConsole = displayConsole.concat(displayText);
  };
  this.getDisplayConsole = function () {
    return displayConsole;
  };
  this.clearDisplayConsole = function () {
    displayConsole = [];
  };

  // lex the joy source string
  function lex(source) {
    if (errors.length > 0) {
      return [];
    }

    function isWhitespace(c) {
      return c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\f';
    }
    const s1 = source
      .replace(/\[/g, ' [ ')
      .replace(/\]/g, ' ] ')
      .replace(/;/g, ' ; ');
    const s2 = `${s1} `;
    const tokens = [];
    let tok = '';
    let str = false;
    let last = '';
    for (let i = 0; i < s2.length; i += 1) {
      const c = s2[i];
      if (str) {
        tok += c;
        if (c === '"' && last !== '\\') {
          tokens.push(tok);
          tok = '';
          str = false;
        }
        last = c;
      } else {
        const emptyTok = tok.length === 0;
        if (isWhitespace(c)) {
          if (!emptyTok) {
            tokens.push(tok);
            tok = '';
          }
        } else {
          if (emptyTok && c === '"') {
            str = true;
          }
          tok += c;
        }
      }
    }
    if (tok.length > 0) errors.push(`Incomplete string token: '${tok}'`);

    return tokens;
  }

  function literal(val) {
    if (val.length > 1 && val[0] === '"' && val[val.length - 1] === '"') {
      const lit = val.slice(1, val.length - 1);
      return { kind: 'literal', disp: lit, val: lit };
    }
    return { kind: 'literal', disp: val, val: Number(val) };
  }

  function error(token) {
    const e = function () {
      errors.push(`Undefined word: '${token}'`);
    };
    e.kind = 'error';
    e.disp = token;
    return e;
  }

  function word(token) {
    const w = dictionary[token];
    if (w) {
      return w;
    }
    try {
      return literal(token);
    } catch (ex) {
      return error(token);
    }
  }

  function parse(tokens) {
    const ast = [];
    ast.kind = 'list';
    while (tokens.length > 0) {
      const t = tokens.shift();
      switch (t) {
        case '[':
          ast.push(parse(tokens));
          break;
        case ']':
          return ast;
        case '$':
        case 'append':
        case 'empty':
          this.pushError(`t = ${t}`);
          break;
        default:
          ast.push(word(t));
          break;
      }
    }
    return ast;
  }

  function compile(quote) {
    return function () {
      for (let i = 0; i < quote.length; i += 1) {
        const w = quote[i];
        if (typeof w === 'function') w();
        else if (w.kind === 'list') context.Stack.unshift(w);
        else if (w.kind === 'literal') context.Stack.unshift(w.val);
        else errors.push(`Unexpected kind: ${w.kind}`);
      }
    };
  }

  function print(ast) {
    let output = '';
    switch (typeof ast) {
      case 'number':
      case 'string':
      case 'boolean':
        return ast;
      case 'object':
        for (let i = 0; i < ast.length; i += 1) {
          const a = ast[i];
          if (a.kind === 'list') {
            output += `[ ${print(a)}] `;
          } else if (a.disp) output += `${a.disp} `;
          else output += `${a} `;
        }
        return output;
      default:
        return '';
    }
  }

  function escape(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;');
  }

  function render(ast) {
    let html = '';
    for (let i = 0; i < ast.length; i += 1) {
      const a = ast[i];
      if (a.kind === 'list') { html += `<span class='list'>${render(a)}</span>`; } else html += `<span class='${a.kind}'>${escape(a.disp)}</span>`;
    }
    return html;
  }

  function define(quote, name) {
    const c = compile(quote);
    c.kind = 'secondary';
    c.disp = name;
    dictionary[name] = c;
  }

  this.Words = function () {
    const w = [];
    Object.keys(dictionary).forEach((key) => {
      w.push(key);
    });
    return w;
  };

  // non primitive function definitions for display
  function storeIfDefine(source) {
    const tokens = lex(source);
    const len = tokens.length;
    if (len < 5 || tokens[len - 1] !== 'define') {
      return;
    }
    const newSource = tokens.slice(1, len - 3).reduce((s, tok) => `${s} ${tok}`);
    const name = tokens[len - 2].replace(/"/g, '');
    defines[name] = newSource;
  }
  this.getDefines = function () {
    return defines;
  };


  this.Primitive = function (name, func) {
    const f = func;
    const newWord = function () {
      const len = f.length;
      assertStack(len);
      const args = context.Stack.slice(0, len).reverse(); // TODO: more efficient that slice/reverse
      context.Stack = context.Stack.slice(len);
      const result = f(...args);
      if (result) {
        if (result.kind === 'tuple') {
          for (let i = 0; i < result.length; i += 1) {
            context.Stack.unshift(result[i]);
          }
        } else {
          context.Stack.unshift(result);
        }
      }
    };
    newWord.kind = 'primitive';
    newWord.disp = name;
    dictionary[name] = newWord;
    return newWord;
  };

  this.Reset = function () {
    context = { Stack: [] };
  };

  this.Push = function (val) {
    if (val !== null && val !== undefined) context.Stack.unshift(val);
  };

  this.Peek = function () {
    assertStack(1);
    return context.Stack[0];
  };

  this.Pop = function () {
    assertStack(1);
    return context.Stack.shift();
  };

  this.Word = function (token) {
    return word(token);
  };

  this.Parse = function (source) {
    return parse(lex(source));
  };

  this.Lex = function (source) {
    return lex(source);
  };

  this.Render = function (ast) {
    return render(ast);
  };

  this.Context = function () {
    return context;
  };

  this.Print = function (ast) {
    return print(ast);
  };

  this.Compile = function (source) {
    return compile(parse(lex(source)));
  };

  this.Execute = function (source) {
    this.clearErrors();
    this.clearResults();
    storeIfDefine(source);
    this.Compile(source)();
  };

  this.Run = function (ast) {
    compile(ast)();
  };

  this.Init = function () {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i += 1) {
      if (scripts[i].type === 'text/brief') {
        const lines = scripts[i].innerHTML.split('\n');
        for (let j = 0; j < lines.length; j += 1) {
          this.Execute(lines[j]);
        }
      }
    }
  };

  this.JoyDefine = function (xs) {
    const len = xs.length;
    if (len < 4) {
      return;
    }
    if (xs[1] !== '==' || xs[len - 1] !== ';') {
      return;
    }
    const body = xs.slice(2, len - 1).join(' ');
    const defineText = `[ ${body} ] "${xs[0]}" define`;
    this.Execute(defineText);
  };

  /* eslint no-param-reassign: ["error", { "props": false }] */
  function stripComments(o, keep, isStr) {
    while (o.source.length > 0) {
      const c = o.source.slice(0, 1);
      o.source = o.source.slice(1);
      switch (c) {
        case '(':
          if (
            !isStr &&
            keep &&
            o.source.length > 1 &&
            o.source.slice(0, 1) === '*'
          ) {
            stripComments(o, false, isStr);
          } else if (isStr) {
            o.result += c;
          }
          break;

        case '*':
          if (!isStr && o.source.length > 1 && o.source.slice(0, 1) === ')') {
            o.source = o.source.slice(1);
            return;
          }
          if (keep) {
            o.result += c;
          }
          break;

        case '"':
          if (isStr) {
            o.result += c;
            return;
          }
          o.result += c;
          stripComments(o, keep, true);
          break;

        case '#':
          if (!isStr) {
            while (o.source.slice(0, 1) !== '\n') {
              o.source = o.source.slice(1);
            }
          }
          break;

        case '\n':
          // temp \n placeholder for strings
          if (isStr && keep) {
            o.result += '!@#$';
          } else {
            o.result += c;
          }
          break;

        case '.':
          if (!isStr && keep) {
            o.result += ' .';
          }
          break;

        default:
          if (keep) {
            o.result += c;
          }
          break;
      }
    }
  }

  function sourceToLines(source) {
    const obj = { source, result: ' ' };
    stripComments(obj, true, false);
    const xs = obj.result
      .split('\n')
      .map(x => x.trim())
      .filter(w => w !== '');
    return xs;
  }

  function prepareSource(source) {
    function fillList(zs) {
      const zss = [];
      let ys = [];
      for (let i = 0; i < zs.length; i += 1) {
        ys.push(zs[i]);
        if (zs[i] === ';') {
          zss.push(ys);
          ys = [];
        }
      }
      return zss;
    }

    const obj = { source, result: ' ' };
    stripComments(obj, true, false);
    const xs = lex(obj.result);
    let xss = [];

    // is LIBRA ?
    if (
      xs.length > 0 &&
      xs[0].toUpperCase() === 'LIBRA' &&
      xs[xs.length - 1] === '.'
    ) {
      xs[xs.length - 1] = ';';
      xs.shift();
      xss = fillList(xs);
    }

    return xss;
  }

  this.JoyMultiLine = function (source) {
    const sourceLines = sourceToLines(source);
    const aaa = lex(sourceLines.join(' '));


    // create defines list for LIBRA and DEFINE
    // create execute list for '.' function
    // execute defines
    // execute '.' functions output to  diplayConsole

    // let xss = prepareSource(source);
    // for (var i = 0; i < xss.length; i += 1) {
    //     this.JoyDefine(xss[i])
    // }

    return sourceLines;
  };

  this.Primitive('define', (quote, name) => {
    define(quote, name);
  });

  return this;
}(); // Brief

// utility function
function is2Numbers(x, y) {
  return typeof x === 'number' && typeof y === 'number';
}

// stack
Brief.Primitive('pop', () => { Brief.Pop(); });
Brief.Primitive('.', (x) => {
  Brief.pushResult(Brief.Print(x));
});
Brief.Primitive('dup', (x) => {
  const ret = [x, x];
  ret.kind = 'tuple';
  return ret;
});
Brief.Primitive('swap', (y, x) => {
  const ret = [x, y];
  ret.kind = 'tuple';
  return ret;
});

// stdout/stdin
Brief.Primitive('putchars', (x) => {
  if (typeof x !== 'string') {
    Brief.pushError('string needed for putchars');
    return;
  }
  Brief.concatDisplayConsole([Brief.Print(x)]);
});

// combinators
Brief.Primitive('dip', (x, q) => {
  Brief.Run(q);
  Brief.Push(x);
});

// arithmetic
Brief.Primitive('+', (y, x) => {
  if (typeof y === 'string' && y.length === 1 && typeof x === 'number') {
    return String.fromCharCode(y.charCodeAt(0) + x);
  }
  if (!is2Numbers(x, y)) {
    Brief.pushError("opperands for '+' must be numbers");
    return 0;
  }
  return y + x;
});
Brief.Primitive('-', (y, x) => {
  if (typeof y === 'string' && y.length === 1 && typeof x === 'number') {
    return String.fromCharCode(y.charCodeAt(0) - x);
  }
  if (!is2Numbers(x, y)) {
    Brief.pushError("opperands for '-' must be numbers");
    return 0;
  }
  return y - x;
});
Brief.Primitive('*', (y, x) => {
  if (!is2Numbers(x, y)) {
    Brief.pushError("opperands for '*' must be numbers");
    return 0;
  }
  return y * x;
});
Brief.Primitive('/', (y, x) => {
  if (!is2Numbers(x, y)) {
    Brief.pushError("opperands for '/' must be numbers");
    return 0;
  }
  if (x === 0) {
    Brief.pushError("divisor for '/' must not be 0");
    return 0;
  }
  return y / x;
});
Brief.Primitive('rem', (y, x) => {
  if (!is2Numbers(x, y)) {
    Brief.pushError("opperands for 'rem' must be numbers");
    return;
  }
  Brief.Push(y % x);
});

// comparison
Brief.Primitive('=', (y, x) => {
  Brief.Push(y === x);
});
Brief.Primitive('<', (y, x) => {
  Brief.Push(y < x);
});
Brief.Primitive('>', (y, x) => {
  Brief.Push(y > x);
});
Brief.Primitive('<=', (y, x) => {
  Brief.Push(y <= x);
});
Brief.Primitive('>=', (y, x) => {
  Brief.Push(y >= x);
});

// boolean/conditional
Brief.Primitive('not', (x) => {
  Brief.Push(!x);
});
Brief.Primitive('and', (y, x) => {
  Brief.Push(y && x);
});
Brief.Primitive('or', (y, x) => {
  Brief.Push(y || x);
});
Brief.Primitive('xor', (y, x) => {
  Brief.Push((y || x) && !(y && x));
});
Brief.Primitive('ifte', (x, p, q) => {
  Brief.Run(x);
  const predicate = Brief.Pop();
  if (typeof predicate !== 'boolean') {
    Brief.pushError('predicate quotation does not evalute to a boolean');
    return;
  }
  Brief.Run(predicate ? p : q);
});
Brief.Primitive('iflist', (x) => {
  Brief.Push(typeof x === 'object' && x.kind === 'list');
});
Brief.Primitive('ifinteger', (x) => {
  Brief.Push(typeof x === 'number' && x % 1 === 0);
});
Brief.Primitive('iffloat', (x) => {
  Brief.Push(typeof x === 'number' && x % 1 !== 0);
});
Brief.Primitive('ifstring', (x) => {
  Brief.Push(typeof x === 'string');
});

// lists
Brief.Primitive('size', x => x.length);

Brief.Primitive('cons', (x, xs) => {
  if (typeof x === 'string' && x.length === 1 && typeof xs === 'string') {
    return x + xs;
  }
  if (typeof x === 'object' || !(typeof xs === 'object' && xs.kind === 'list')) {
    Brief.pushError("arguments for 'cons' must be a literal followed by a list/quotation");
    return xs;
  }
  xs.unshift({ val: x, kind: 'literal', disp: x.toString() });
  return xs;
});

Brief.Primitive('snoc', (xs) => {
  if (typeof xs === 'string' && xs.length > 0) {
    Brief.Push(xs[0]);
    return xs.slice(1);
  }
  if (!(typeof xs === 'object' && xs.kind === 'list')) {
    Brief.pushError("argument for 'snoc' must be a non-empty list/quotation/string");
    return xs;
  }
  const x = xs.shift();
  Brief.Push(x.val);
  return xs;
});

Brief.Primitive('concat', (xs, ys) => {
  if (typeof xs !== typeof ys) {
    Brief.pushError("arguments for 'conat' must be the same type");
    return xs;
  }
  if (typeof xs === 'string' && typeof ys === 'string') {
    return xs.concat(ys);
  }
  if (xs.kind !== 'list' || ys.kind !== 'list') {
    Brief.pushError("arguments for 'conat' must be a lists and/or quatations");
    return xs;
  }
  for (let i = 0; i < ys.length; i += 1) {
    xs.push(ys[i]);
  }
  return xs;
});

// jquery
// Brief.Primitive("$", function (x) { Brief.Push($(x)); });
// Brief.Primitive("append", function (y, x) { return y.append(x); });
// Brief.Primitive("empty", function (x) { return x.empty(); });

// miscellaneous
// Brief.Primitive("alert", function (x) { alert(x); });
// Brief.Primitive("script", function (s) { eval(s); });
// Brief.Primitive("eval", function (c) { Brief.Execute(c); })

Brief.Primitive('aaa', () => {
  const source = `
(* Sample application for editor *)

(* FILE:   samplelib.joy *)

LIBRA

    _samplelib == true; 

(* more 
   comments *)

    new-sum == 
        0 
        [ + ] 
        fold;   # redefine sum # #############

    new-prod == 1 [ * ] fold;  # another comment 

    test1 == "aaa \"bbb\" ccc";
    test2 == "aaa  (* ccc *) ##";

    SAMPLELIB == "samplelib.joy - simple sample library\n".

(* end LIBRA *)

"samplelib is loaded\n" putchars.


(* 
    libload - read file and add to defines

    DEFINE -
        no lines between statements
        ';' termination except last '.'
*)

DEFINE
    square == dup *;
    quad == square
            square;
    quad-list == [ quad ] map;
    quad-prod-sum-diff == quad-list dup new-prod swap new-sum -.

[1 2 3 4 5] quad-prod-sum-diff.

    `;
  Brief.JoyMultiLine(source);
});

Brief.Primitive('range', (y, x) => {
  const r = [];
  r.kind = 'list';
  for (let i = x; i <= y; i += 1) {
    r.push({ kind: 'literal', disp: i.toString(), val: i });
  }
  Brief.Push(r);
});

Brief.Primitive('map', (xs, q) => {
  let ys = '';
  const xsCopy = xs;
  switch (typeof xs) {
    case 'string':
      for (let i = 0; i < xs.length; i += 1) {
        Brief.Push(xs[i]);
        Brief.Run(q);
        const v = Brief.Pop();
        ys += v;
      }
      Brief.Push(ys);
      break;
    case 'object':
      if (xs.kind === 'list') {
        for (let i = 0; i < xs.length; i += 1) {
          Brief.Push(xsCopy[i].val);
          Brief.Run(q);
          const v = Brief.Pop();
          xsCopy[i].val = v;
          xsCopy[i].disp = v.toString();
        }
        Brief.Push(xs);
      }
      break;
    default:
      Brief.pushError("first argument of 'map' must be a string or list/quotation");
  }
});

Brief.Primitive('filter', (xs, q) => {
  let ys = '';
  switch (typeof xs) {
    case 'string':
      for (let i = 0; i < xs.length; i += 1) {
        Brief.Push(xs[i]);
        Brief.Run(q);
        if (Brief.Pop()) ys += xs[i];
      }
      Brief.Push(ys);
      break;
    case 'object':
      if (xs.kind === 'list') {
        const f = [];
        f.kind = 'list';
        for (let i = 0; i < xs.length; i += 1) {
          const x = xs[i];
          Brief.Push(x.val);
          Brief.Run(q);
          if (Brief.Pop()) f.push(x);
        }
        Brief.Push(f);
      }
      break;
    default:
      Brief.pushError("first argument of 'filter' must be a string or list/quotation");
  }
});

Brief.Primitive('fold', (xs, b, q) => {
  let a = b;
  switch (typeof xs) {
    case 'string':
      for (let i = 0; i < xs.length; i += 1) {
        Brief.Push(a);
        Brief.Push(xs[i]);
        Brief.Run(q);
        a = Brief.Pop();
      }
      Brief.Push(a);
      break;
    case 'object':
      if (xs.kind === 'list') {
        for (let i = 0; i < xs.length; i += 1) {
          Brief.Push(a);
          Brief.Push(xs[i].val);
          Brief.Run(q);
          a = Brief.Pop();
        }
        Brief.Push(a);
      }
      break;
    default:
      Brief.pushError("first argument of 'fold' must be a string or list/quotation");
  }
});

Brief.Primitive('words', () => {
  const words = [];
  words.kind = 'list';
  const dict = Brief.Words();
  Object.keys(dict).forEach((key) => {
    const func = Brief.Word(dict[key]);
    if (func.kind === 'primitive') {
      words.push(func);
    }
  });
  words.sort((a, b) => {
    if (a.disp > b.disp) return 1;
    if (a.disp < b.disp) return -1;
    return 0;
  });
  return words;
});

Brief.Primitive('defines', () => {
  const xs = [];
  xs.kind = 'list';
  const dict = Brief.Words();
  Object.keys(dict).forEach((key) => {
    const func = Brief.Word(dict[key]);
    if (func.kind === 'secondary') {
      xs.push(func);
    }
  });
  xs.sort((a, b) => {
    if (a.disp > b.disp) return 1;
    if (a.disp < b.disp) return -1;
    return 0;
  });
  return xs;
});

/* eliminated
Brief.Execute('[ [ 2dip ] 2dip [ dip ] dip apply ]    "tri*"      define');
Brief.Execute('[ [ 2dip ] dip apply ]                 "2cleave*"  define');
Brief.Execute('[ [ 2dup ] dip 2dip ]                  "2keep"     define');
Brief.Execute('[ [ 2keep ] 2dip [ 2keep ] dip apply ] "2tri"      define');
Brief.Execute('[ [ 2keep ] dip apply ]                "2cleave"   define');
Brief.Execute('[ [ 3dup ] dip 3dip ]                  "3keep"     define');
Brief.Execute('[ [ 3keep ] 2dip [ 3keep ] dip apply ] "3tri"      define');
Brief.Execute('[ [ 3keep ] dip apply ]                "3cleave"   define');
Brief.Execute('[ [ 4dip ] 2dip [ 2dip ] dip apply ]   "2tri*"     define');
Brief.Execute('[ [ dip ] dip apply ]                  "cleave*"   define');
Brief.Execute('[ [ dup ] dip swap ]                   "over"      define');
Brief.Execute('[ [ keep ] 2dip [ keep ] dip apply ]   "tri"       define');
Brief.Execute('[ [ over ] dip swap ]                  "pick"      define');
Brief.Execute('[ [ pop2 ] dip ]                       "2nip"      define');
Brief.Execute('[ [ sum ] [ size ] cleave / ]          "average"   define');
Brief.Execute('[ 0 [ + ] fold ]                       "sum"       define');
Brief.Execute('[ 1 [ * ] fold ]                       "prod"      define');
Brief.Execute('[ 1 range prod ]                       "factorial" define');
Brief.Execute('[ cleave@ and ]                        "both?"     define');
Brief.Execute('[ cleave@ or ]                         "either?"   define');
Brief.Execute('[ dup * ]                              "square"    define');
Brief.Execute('[ dup 2dip apply ]                     "cleave@"   define');
Brief.Execute('[ dup 3dip apply ]                     "2cleave@"  define');
Brief.Execute('[ dup 3dip dup 2dip apply ]            "tri@"      define');
Brief.Execute('[ dup 4dip apply ]                     "2tri@"     define');
Brief.Execute('[ over over ]                          "2dup"      define');
Brief.Execute('[ pick pick pick ]                     "3dup"      define');
Brief.Execute('[ swap [ 2dip ] dip ]                  "3dip"      define');
Brief.Execute('[ swap [ 3dip ] dip ]                  "4dip"      define');
Brief.Execute('[ swap [ dip ] dip ]                   "2dip"      define');
Brief.Execute('[ swap pop ]                           "nip"       define');
*/

// core
Brief.Execute('[ [ ] ifte ]                           "when"      define');
Brief.Execute('[ [ ] swap ifte ]                      "unless"    define');
Brief.Execute('[ [ dup ] dip ]                        "dupd"      define');
Brief.Execute('[ [ keep ] dip apply ]                 "cleave"    define'); // from bi to cleave
Brief.Execute('[ [ swap ] dip ]                       "swapd"     define');
Brief.Execute('[ [ true ] swap when ]                 "apply"     define');
Brief.Execute('[ 0 swap - ]                           "neg"       define');
Brief.Execute('[ dup 0 < [ neg ] when ]               "abs"       define');
Brief.Execute('[ dupd dip ]                           "keep"      define');
Brief.Execute('[ pop pop ]                            "pop2"      define');
Brief.Execute('[ pop pop pop ]                        "pop3"      define');
Brief.Execute('[ rolldown rolldown ]                  "rollup"    define'); // from -rot to rollup
Brief.Execute('[ swapd swap ]                         "rolldown"  define'); // from rot to rolldown

// added for joy compatibility
Brief.Execute('[ swap cons ]                          "swons"     define');
Brief.Execute('[ [pop] dip ]                          "popd"      define');
Brief.Execute('[ snoc pop ]                           "first"     define');
Brief.Execute('[ snoc swap pop ]                      "rest"      define');

// added for Brief to Joy testing
Brief.Execute('[ [ dup "a" >= ] [ 32 - ] [ ] ifte ]      "to-upper"             define');
Brief.Execute('[ [ dup "a" < ]  [ 32 + ] [ ] ifte ]      "to-lower"             define');
// Brief.Execute('[ 0 [ + ] fold ]                          "new-sum"              define');
// Brief.Execute('[ 1 [ * ] fold ]                          "new-prod"             define');
// Brief.Execute('[ dup * ]                                 "square"               define');
// Brief.Execute('[ quad == square square ]                 "quad"                 define');
// Brief.Execute('[ [ quad ] map ]                          "quad-list"            define');
// Brief.Execute('[ quad-list dup new-prod swap new-sum - ] "quad-prod-sum-diff"    define');
Brief.Execute('[ "Monday" "Tuesday" "Wednesday" "Thursday" "Friday" "Saturday" "Sunday" ] "weekdays" define');

$(document).ready(() => {
  Brief.Init();
});

/*
TODO:
- Support recursive definitions
*/
