import { TraceKitStackFrame, TraceKitStackTrace } from "./tracekit";
import { Exception, StackFrame, ErrorEventInput } from "./types";

const STACKTRACE_LIMIT = 50;

/**
 * @hidden
 */
export function prepareFramesForEvent(
  stack: TraceKitStackFrame[]
): StackFrame[] {
  if (!stack || !stack.length) {
    return [];
  }

  let localStack = stack;

  const firstFrameFunction = localStack[0].func || '';
  const lastFrameFunction = localStack[localStack.length - 1].func || '';

  // If stack starts with one of our API calls, remove it (starts, meaning it's the top of the stack - aka last call)
  if (
    firstFrameFunction.indexOf('captureMessage') !== -1 ||
    firstFrameFunction.indexOf('captureException') !== -1
  ) {
    localStack = localStack.slice(1);
  }

  // If stack ends with one of our internal API calls, remove it (ends, meaning it's the bottom of the stack - aka top-most call)
  if (lastFrameFunction.indexOf('sentryWrapped') !== -1) {
    localStack = localStack.slice(0, -1);
  }

  // The frame where the crash happened, should be the last entry in the array
  return localStack
    .slice(0, STACKTRACE_LIMIT)
    .map(
      (frame: TraceKitStackFrame): StackFrame => ({
        colno: frame.column === null ? undefined : frame.column,
        filename: frame.url || localStack[0].url,
        function: frame.func || '?',
        in_app: true,
        lineno: frame.line === null ? undefined : frame.line,
      })
    )
    .reverse();
}

/**
 * This function creates an exception from an TraceKitStackTrace
 * @param stacktrace TraceKitStackTrace that will be converted to an exception
 * @hidden
 */
 export function exceptionFromStacktrace(stacktrace: TraceKitStackTrace): Exception {
  const frames = prepareFramesForEvent(stacktrace.stack);

  const exception: Exception = {
    type: stacktrace.name,
    value: stacktrace.message,
  };

  if (frames && frames.length) {
    exception.stacktrace = { frames };
  }

  if (exception.type === undefined && exception.value === '') {
    exception.value = 'Unrecoverable error caught';
  }

  return exception;
}

/**
 * Adds exception mechanism to a given event.
 * @param event The event to modify.
 * @param mechanism Mechanism of the mechanism.
 * @hidden
 */
 export function addExceptionMechanism(
  event: ErrorEventInput,
  mechanism: {
    [key: string]: any;
  } = {},
): void {
  // TODO: Use real type with `keyof Mechanism` thingy and maybe make it better?
  try {
    // @ts-ignore Type 'Mechanism | {}' is not assignable to type 'Mechanism | undefined'
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    event.exception!.values![0].mechanism = event.exception!.values![0].mechanism || {};
    Object.keys(mechanism).forEach(key => {
      // @ts-ignore Mechanism has no index signature
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      event.exception!.values![0].mechanism[key] = mechanism[key];
    });
  } catch (_oO) {
    // no-empty
  }
}
