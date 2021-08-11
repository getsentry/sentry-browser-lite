import { captureEvent } from '../src/sentry';
import { ErrorEvent } from '../src/types';
import { SDK_INFO } from '../src/constants';

const e: ErrorEvent = {
  event_id: "ok",
  timestamp: Date.now() / 1000,
  sdk: SDK_INFO,
}

global.fetch = jest.fn();

describe("Sentry", () => {
  beforeEach(() => {
    global.fetch
  })
  describe("captureEvent", () => {
    it("produces an error", () => {
      captureEvent(e, { endpoint: "https://o447951.ingest.sentry.io/api/5429213/envelope/?sentry_key=d16ae2d36f9249849c7964e9a3a8a608" });
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})

