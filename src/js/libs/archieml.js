'use strict';

// Structure inspired by John Resig's HTML parser
// http://ejohn.org/blog/pure-javascript-html-parser/

(function() {

// The load function takes a string of text as its only argument.
// It then proceeds to match the text to one of several regular expressions
// which match patterns for different types of commands in AML.
function load(input, options) {
  var nextLine = new RegExp('.*((\r|\n)+)');
  var startKey = new RegExp('^\\s*([A-Za-z0-9-_\.]+)[ \t\r]*:[ \t\r]*(.*(?:\n|\r|$))');
  var commandKey = new RegExp('^\\s*:[ \t\r]*(endskip|ignore|skip|end).*?(\n|\r|$)', 'i');
  var arrayElement = new RegExp('^\\s*\\*[ \t\r]*(.*(?:\n|\r|$))');
  var scopePattern = new RegExp('^\\s*(\\[|\\{)[ \t\r]*([A-Za-z0-9-_\.]*)[ \t\r]*(?:\\]|\\}).*?(\n|\r|$)');

  var data = {},
      scope = data,

      stack = [],
      stackScope = undefined,

      bufferScope = null,
      bufferKey = null,
      bufferString = '',

      isSkipping = false;

  var options = options || {};
  if (options.comments !== true) options.comments = false;

  while (input) {
    // Inside the input stream loop, the `input` string is trimmed down as matches
    // are found, and fires a call to the matching parse*() function.
    var match;

    if (commandKey.exec(input)) {
      match = commandKey.exec(input);

      parseCommandKey(match[1].toLowerCase());

    } else if (!isSkipping && startKey.exec(input) && (!stackScope || stackScope.arrayType !== 'simple')) {
      match = startKey.exec(input);

      parseStartKey(match[1], match[2] || '');

    } else if (!isSkipping && arrayElement.exec(input) && stackScope && stackScope.arrayType !== 'complex') {
      match = arrayElement.exec(input);

      parseArrayElement(match[1]);

    } else if (!isSkipping && scopePattern.exec(input)) {
      match = scopePattern.exec(input);

      parseScope(match[1], match[2]);

    } else if (nextLine.exec(input)) {
      match = nextLine.exec(input);

      bufferString += input.substring(0, match[0].length);

    } else {
      // End of document reached
      input = '';
    }

    if (match) input = input.substring(match[0].length);
  }

  // The following parse functions add to the global `data` object and update
  // scoping variables to keep track of what we're parsing.

  function parseStartKey(key, restOfLine) {
    // When a new key is encountered, the rest of the line is immediately added as
    // its value, by calling `flushBuffer`.
    flushBuffer();

    incrementArrayElement(key);

    bufferKey = key;
    bufferString = restOfLine;

    flushBufferInto(key, {replace: true});
    bufferKey = key;
  }

  function parseArrayElement(value) {
    flushBuffer();

    stackScope.arrayType = stackScope.arrayType || 'simple';

    stackScope.array.push('');
    bufferKey = stackScope.array;
    bufferString = value;
    flushBufferInto(stackScope.array, {replace: true});
    bufferKey = stackScope.array;
  }

  function parseCommandKey(command) {
    // if isSkipping, don't parse any command unless :endskip

    if (isSkipping && !(command === "endskip" || command === "ignore")) return flushBuffer();

    switch (command) {
      case "end":
        // When we get to an end key, save whatever was in the buffer to the last
        // active key.
        if (bufferKey) flushBufferInto(bufferKey, {replace: false});
        return;

      case "ignore":
        // When ":ignore" is reached, stop parsing immediately
        input = '';
        break;

      case "skip":
        isSkipping = true;
        break;

      case "endskip":
        isSkipping = false;
        break;
    }

    flushBuffer();
  }

  function parseScope(scopeType, scopeKey) {
    // Throughout the parsing, `scope` refers to one of the following:
    //   * `data`
    //   * an object - one level within `data` - when we're within a {scope} block
    //   * an object at the end of an array - which is one level within `data` -
    //     when we're within an [array] block.
    //
    // `scope` changes whenever a scope key is encountered. It also changes
    // within parseStartKey when we start a new object within an array.
    flushBuffer();

    if (scopeKey == '') {

      if (scopeType === '{') {
        // Reset scope to global data object
        scope = data;
        stackScope = undefined;
        stack = [];

      } else if (scopeType === '[') {
        // Move up a level
        var lastStackItem = stack.pop();
        if (lastStackItem) scope = lastStackItem.scope || data;
        stackScope = stack[stack.length - 1];
      }

    } else if (scopeType === '[' || scopeType === '{') {
      // Drill down into the appropriate scope, in case the key uses
      // dot.notation.

      var nesting = false;
      var keyScope = data;

      if (scopeKey.indexOf('.') == 0) {
        scopeKey = scopeKey.substring(1);
        incrementArrayElement(scopeKey);
        nesting = true;
        if (stackScope) keyScope = scope;
      }

      var keyBits = scopeKey.split('.');
      for (var i=0; i<keyBits.length - 1; i++) {
        keyScope = keyScope[keyBits[i]] = keyScope[keyBits[i]] || {};
      }

      if (scopeType == '[') {
        var stackScopeItem = {
          array: keyScope[keyBits[keyBits.length - 1]] = [],
          arrayType: null,
          arrayFirstKey: null,
          scope: scope
        };

        if (nesting) {
          stack.push(stackScopeItem);
        } else {
          stack = [stackScopeItem];
        }
        stackScope = stack[stack.length - 1];

      } else if (scopeType == '{') {
        scope = keyScope[keyBits[keyBits.length - 1]] = (typeof keyScope[keyBits[keyBits.length - 1]] === 'object') ? keyScope[keyBits[keyBits.length - 1]] : {};
      }
    }
  }

  function incrementArrayElement(key) {
    // Special handling for arrays. If this is the start of the array, remember
    // which key was encountered first. If this is a duplicate encounter of
    // that key, start a new object.

    if (stackScope && stackScope.array) {
      // If we're within a simple array, ignore
      stackScope.arrayType = stackScope.arrayType || 'complex';
      if (stackScope.arrayType === 'simple') return;

      // arrayFirstKey may be either another key, or null
      if (stackScope.arrayFirstKey === null || stackScope.arrayFirstKey === key) stackScope.array.push(scope = {});
      stackScope.arrayFirstKey = stackScope.arrayFirstKey || key;
    }
  }

  function formatValue(value, type) {
    if (options.comments) {
      value = value.replace(/(?:^\\)?\[[^\[\]\n\r]*\](?!\])/mg, ""); // remove comments
      value = value.replace(/\[\[([^\[\]\n\r]*)\]\]/g, "[$1]"); // [[]] => []
    }

    if (type == 'append') {
      // If we're appending to a multi-line string, escape special punctuation
      // by using a backslash at the beginning of any line.
      // Note we do not do this processing for the first line of any value.
      value = value.replace(new RegExp('^(\\s*)\\\\', 'gm'), "$1");
    }

    return value;
  }

  function flushBuffer() {
    var result = bufferString + '';
    bufferString = '';
    bufferKey = null;
    return result;
  }

  function flushBufferInto(key, options) {
    options = options || {};
    var value = flushBuffer();

    if (options.replace) {
      value = formatValue(value, 'replace').replace(new RegExp('^\\s*'), '');
      bufferString = (new RegExp('\\s*$')).exec(value)[0];
    } else {
      value = formatValue(value, 'append');
    }

    if (typeof key === 'object') {
      // key is an array
      if (options.replace) key[key.length - 1] = '';

      key[key.length - 1] += value.replace(new RegExp('\\s*$'), '');

    } else {
      var keyBits = key.split('.');
      bufferScope = scope;

      for (var i=0; i<keyBits.length - 1; i++) {
        if (typeof bufferScope[keyBits[i]] === 'string') bufferScope[keyBits[i]] = {};
        bufferScope = bufferScope[keyBits[i]] = bufferScope[keyBits[i]] || {};
      }

      if (options.replace) bufferScope[keyBits[keyBits.length - 1]] = '';

      bufferScope[keyBits[keyBits.length - 1]] += value.replace(new RegExp('\\s*$'), '');
    }
  }

  flushBuffer();
  return data;
}

var root = this;
var archieml = {load: load};

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = archieml;
  }
  exports.archieml = archieml;
} else {
  this.archieml = archieml;
}

if (typeof define === 'function' && define.amd) {
  define('archieml', [], function() {
    return archieml;
  });
}
}.call(this))
