export interface ErrorEventInput {
  message?: string;
}

export interface ErrorEvent {
  event_id: string;
  timestamp: Date;
  sdk: SdkInfo;
  message?: string;
}

export interface SdkInfo {
  name: string;
  version: string;
}

export interface Session {}

export interface Options {
  endpoint: string;
  hooks?: LifecycleHooks;
  sampler?: () => boolean;
  rateLimiter?: any;
  transport?: (request: Request) => Promise<Response>;
}

export interface LifecycleHooks {
  onEvent?: (e: ErrorEvent) => ErrorEvent;
  onRequest?: (r: Request) => Request;
}
