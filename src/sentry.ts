import { ErrorEvent, SdkInfo, Options, ErrorEventInput } from './types';
import { SDK_INFO } from './constants';
import { uuid4 } from './utils';

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
  body: ErrorEvent;
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

export function captureException(e: any, opts: Options) {
  const input: ErrorEventInput = {
    message: String(e),
  };
  return captureEvent(input, opts);
}

export function captureEvent(input: ErrorEventInput, opts?: Options) {
  if (!opts?.endpoint) {
    return;
  }
  opts = { ...defaultOptions, ...opts };

  // TODO: check opts.rateLimiter

  let event: ErrorEvent = {
    event_id: uuid4(),
    timestamp: new Date(),
    sdk: SDK_INFO,
    ...(input.message && { message: input.message }),
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
    // mode: 'no-cors',
    // credentials: 'omit',
    // keepalive: true,
  });

  if (opts?.hooks?.onRequest) {
    req = opts?.hooks.onRequest(req);
  }

  opts
    .transport?.(req)
    .then(response => {
      // TODO: update opts.rateLimiter
    })
    .catch(reason => console.log(reason));
}
