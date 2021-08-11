export interface SdkInfo {
  name?: string;
  version?: string;
}

export interface ErrorEvent {
  event_id: string,
  timestamp: number,
  message?: string,
  sdk: SdkInfo,
}

export interface Session {
}

