/**
 * This was originally forked from https://github.com/occ/TraceKit, but has since been
 * largely modified and is now maintained as part of Sentry JS SDK.
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/**
 * An object representing a single stack frame.
 * {string} url The JavaScript or HTML file URL.
 * {string} func The function name, or empty for anonymous functions (if guessing did not work).
 * {string[]?} args The arguments passed to the function, if known.
 * {number=} line The line number, if known.
 * {number=} column The column number, if known.
\ */
export interface TraceKitStackFrame {
  url: string;
  func: string;
  args: string[];
  line: number | null;
  column: number | null;
}

/**
 * An object representing a JavaScript stack trace.
 * {string} name The name of the thrown exception.
 * {string} message The exception error message.
 * {TraceKitStackFrame} stack An array of stack frames.
 */
export interface TraceKitStackTrace {
  name: string;
  message: string;
  mechanism?: string;
  stack: TraceKitStackFrame[];
  failed?: boolean;
}

// global reference to slice
const UNKNOWN_FUNCTION = '?';

// Chromium based browsers: Chrome, Brave, new Opera, new Edge
const chrome = /^\s*at (?:(.*?) ?\()?((?:file|https?|blob|chrome-extension|address|native|eval|webpack|<anonymous>|[-a-z]+:|.*bundle|\/).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
// gecko regex: `(?:bundle|\d+\.js)`: `bundle` is for react native, `\d+\.js` also but specifically for ram bundles because it
// generates filenames without a prefix like `file://` the filenames in the stacktrace are just 42.js
// We need this specific case for now because we want no other regex to match.
const gecko = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:file|https?|blob|chrome|webpack|resource|moz-extension|capacitor).*?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
const winjs = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i;
const geckoEval = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
const chromeEval = /\((\S*)(?::(\d+))(?::(\d+))\)/;

/** JSDoc */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function computeStackTrace(ex: any): TraceKitStackTrace {
  try {
    const stack = computeStackTraceFromStackProp(ex);
    if (stack) return stack;
  } catch (e) {
    // no-empty
  }

  return {
    message: extractMessage(ex),
    name: ex && ex.name,
    stack: [],
    failed: true,
  };
}

function computeStackTraceFromStackProp(ex: any): TraceKitStackTrace | null {
  if (!ex || !ex.stack) {
    return null;
  }

  const stack = [];
  const lines = ex.stack.split('\n');
  let isEval;
  let submatch;
  let parts;
  let element;

  for (let i = 0; i < lines.length; ++i) {
    if ((parts = chrome.exec(lines[i]))) {
      const isNative = parts[2] && parts[2].indexOf('native') === 0; // start of line
      isEval = parts[2] && parts[2].indexOf('eval') === 0; // start of line
      if (isEval && (submatch = chromeEval.exec(parts[2]))) {
        // throw out eval line/column and use top-most line/column number
        parts[2] = submatch[1]; // url
        parts[3] = submatch[2]; // line
        parts[4] = submatch[3]; // column
      }

      // Arpad: Working with the regexp above is super painful. it is quite a hack, but just stripping the `address at `
      // prefix here seems like the quickest solution for now.
      let url =
        parts[2] && parts[2].indexOf('address at ') === 0
          ? parts[2].substr('address at '.length)
          : parts[2];

      // Kamil: One more hack won't hurt us right? Understanding and adding more rules on top of these regexps right now
      // would be way too time consuming. (TODO: Rewrite whole RegExp to be more readable)
      let func = parts[1] || UNKNOWN_FUNCTION;
      const isSafariExtension = func.indexOf('safari-extension') !== -1;
      const isSafariWebExtension = func.indexOf('safari-web-extension') !== -1;
      if (isSafariExtension || isSafariWebExtension) {
        func = func.indexOf('@') !== -1 ? func.split('@')[0] : UNKNOWN_FUNCTION;
        url = isSafariExtension
          ? `safari-extension:${url}`
          : `safari-web-extension:${url}`;
      }

      element = {
        url,
        func,
        args: isNative ? [parts[2]] : [],
        line: parts[3] ? +parts[3] : null,
        column: parts[4] ? +parts[4] : null,
      };
    } else if ((parts = winjs.exec(lines[i]))) {
      element = {
        url: parts[2],
        func: parts[1] || UNKNOWN_FUNCTION,
        args: [],
        line: +parts[3],
        column: parts[4] ? +parts[4] : null,
      };
    } else if ((parts = gecko.exec(lines[i]))) {
      isEval = parts[3] && parts[3].indexOf(' > eval') > -1;
      if (isEval && (submatch = geckoEval.exec(parts[3]))) {
        // throw out eval line/column and use top-most line number
        parts[1] = parts[1] || `eval`;
        parts[3] = submatch[1];
        parts[4] = submatch[2];
        parts[5] = ''; // no column when eval
      } else if (i === 0 && !parts[5] && ex.columnNumber !== void 0) {
        // FireFox uses this awesome columnNumber property for its top frame
        // Also note, Firefox's column number is 0-based and everything else expects 1-based,
        // so adding 1
        // NOTE: this hack doesn't work if top-most frame is eval
        stack[0].column = (ex.columnNumber as number) + 1;
      }
      element = {
        url: parts[3],
        func: parts[1] || UNKNOWN_FUNCTION,
        args: parts[2] ? parts[2].split(',') : [],
        line: parts[4] ? +parts[4] : null,
        column: parts[5] ? +parts[5] : null,
      };
    } else {
      continue;
    }

    if (!element.func && element.line) {
      element.func = UNKNOWN_FUNCTION;
    }

    stack.push(element);
  }

  if (!stack.length) {
    return null;
  }

  return {
    message: extractMessage(ex),
    name: ex.name,
    stack,
  };
}

/**
 * There are cases where stacktrace.message is an Event object
 * https://github.com/getsentry/sentry-javascript/issues/1949
 * In this specific case we try to extract stacktrace.message.error.message
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMessage(ex: any): string {
  const message = ex && ex.message;
  if (!message) {
    return 'No error message';
  }
  if (message.error && typeof message.error.message === 'string') {
    return message.error.message;
  }
  return message;
}
