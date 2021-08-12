import {
  ErrorEventFinal,
  SdkInfo,
  Options,
  ErrorEventInput,
  Severity,
  Exception,
} from './types';
import { SDK_INFO } from './constants';
import { uuid4 } from './utils';
import { computeStackTrace } from './tracekit';
import { exceptionFromStacktrace } from './parsers';

const defaultOptions: Partial<Options> = {
  transport: (r: Request) => fetch(r),
};

interface ErrorEventEnvelope {
  headers: {
    event_id: string;
    sent_at: string;
    sdk: SdkInfo;
  };
  itemHeaders: {
    type: string;
  };
  body: ErrorEventFinal;
}

function stringifyEnvelope({
  headers,
  itemHeaders,
  body,
}: ErrorEventEnvelope): string {
  return `${JSON.stringify(headers)}\n${JSON.stringify(
    itemHeaders
  )}\n${JSON.stringify(body)}`;
}

export function captureException(e: unknown, opts?: Options) {
  const event: ErrorEventInput = {
    level: Severity.Error,
  };
  let exception: Exception = {};
  // Check if ErrorEvent
  if (
    Object.prototype.toString.call(e) === '[object ErrorEvent]' &&
    (e as ErrorEvent).error
  ) {
    // If it is an ErrorEvent with `error` property, extract it to get actual Error
    exception = exceptionFromStacktrace(
      computeStackTrace((e as ErrorEvent).error)
    );
  } else if (isError(e)) {
    // we have a real Error object, do nothing
    exception = exceptionFromStacktrace(computeStackTrace(e as Error));
  } else {
    console.error('Could not parse event');
  }

  exception.mechanism = {
    type: 'generic',
    handled: true,
  };
  captureEvent(
    {
      ...event,
      exception: {
        values: [exception as Exception],
      },
    },
    opts
  );
}

export function captureMessage(e: unknown, opts?: Options) {
  const input: ErrorEventInput = {
    message: String(e),
    level: Severity.Info,
  };
  return captureEvent(input, opts);
}

function captureEvent(input: ErrorEventInput, opts?: Options) {
  if (!opts?.endpoint) {
    return;
  }
  opts = { ...defaultOptions, ...opts };

  // TODO: check opts.rateLimiter

  let event: ErrorEventFinal = {
    event_id: uuid4(),
    timestamp: new Date(),
    sdk: SDK_INFO,
    ...input,
  };

  if (opts?.sampler && !opts.sampler()) {
    return;
  }

  if (opts?.hooks?.onEvent) {
    event = opts.hooks.onEvent(event);
  }

  const env: ErrorEventEnvelope = {
    headers: {
      event_id: event.event_id,
      sent_at: new Date().toISOString(),
      sdk: event.sdk,
    },
    itemHeaders: {
      type: 'event',
    },
    body: event,
  };

  let req = new Request(opts.endpoint, {
    method: 'POST',
    body: stringifyEnvelope(env),
    credentials: 'omit',
    keepalive: true,
  });

  if (opts?.hooks?.onRequest) {
    req = opts?.hooks.onRequest(req);
  }

  opts
    .transport?.(req)
    .then(_response => {
      // TODO: update opts.rateLimiter
    })
    .catch(reason => console.log(reason));
}

/**
 * Checks whether given value's type is one of a few Error or Error-like
 * {@link isError}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
export function isError(wat: any): boolean {
  switch (Object.prototype.toString.call(wat)) {
    case '[object Error]':
      return true;
    case '[object Exception]':
      return true;
    case '[object DOMException]':
      return true;
    default:
      return isInstanceOf(wat, Error);
  }
}

/**
 * Checks whether given value's type is an instance of provided constructor.
 * {@link isInstanceOf}.
 *
 * @param wat A value to be checked.
 * @param base A constructor to be used in a check.
 * @returns A boolean representing the result.
 */
export function isInstanceOf(wat: any, base: any): boolean {
  try {
    return wat instanceof base;
  } catch (_e) {
    return false;
  }
}

