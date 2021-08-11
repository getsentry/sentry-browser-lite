export interface ErrorEvent {
  id: string,
  timestamp: Date,
  message?: string,
}

export interface Session {
}

const e: ErrorEvent = {
  id: "ok",
  timestamp: new Date(),
}

const endpoint = "https://sentry.io/api/1/envelope?k=v"

function captureEvent(e: ErrorEvent, {endpoint: string}) {}

function captureSession(s: Session, {endpoint: string}) {}
