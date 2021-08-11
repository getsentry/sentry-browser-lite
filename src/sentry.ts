import { ErrorEvent, SdkInfo } from './types';

interface Envelope {
  headers: {
    event_id: string,
    sent_at: string,
    sdk: SdkInfo,
  },
  itemHeaders: {
    type: string,
  },
  body: ErrorEvent,
}

function stringifyEnvelope({ headers, itemHeaders, body }: Envelope): string {
  return `${JSON.stringify(headers)}\n${JSON.stringify(itemHeaders)}\n${body}`
}

export function captureEvent(e: ErrorEvent, { endpoint }: { endpoint: string }) {
  const env: Envelope = {
    headers: {
      event_id: e.event_id,
      sent_at: new Date().toISOString(),
      sdk: e.sdk,
    },
    itemHeaders: {
      type: "event",
    },
    body: e,
  }

  void fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    credentials: 'omit',
    cache: 'no-cache',
    referrerPolicy: 'no-referrer',
    body: stringifyEnvelope(env),
  });
}

// function captureSession(s: Session, { endpoint }: { endpoint: string }) {}
