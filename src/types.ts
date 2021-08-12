export interface ErrorEventInput {
  level: Severity;
  message?: string;
  exception?: {
    values?: Exception[];
  };
}

export type ErrorEventFinal = {
  event_id: string;
  timestamp: Date;
  sdk: SdkInfo;
} & ErrorEventInput;

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
  onEvent?: (e: ErrorEventFinal) => ErrorEventFinal;
  onRequest?: (r: Request) => Request;
}

export enum Severity {
  /** JSDoc */
  Fatal = 'fatal',
  /** JSDoc */
  Error = 'error',
  /** JSDoc */
  Warning = 'warning',
  /** JSDoc */
  Log = 'log',
  /** JSDoc */
  Info = 'info',
  /** JSDoc */
  Debug = 'debug',
  /** JSDoc */
  Critical = 'critical',
}

export interface StackFrame {
  filename?: string;
  function?: string;
  module?: string;
  platform?: string;
  lineno?: number;
  colno?: number;
  abs_path?: string;
  context_line?: string;
  pre_context?: string[];
  post_context?: string[];
  in_app?: boolean;
  instruction_addr?: string;
  addr_mode?: string;
  vars?: { [key: string]: any };
}

export interface Stacktrace {
  frames?: StackFrame[];
  frames_omitted?: [number, number];
}

export interface Exception {
  type?: string;
  value?: string;
  mechanism?: Mechanism;
  module?: string;
  thread_id?: number;
  stacktrace?: Stacktrace;
}

export interface Mechanism {
  type: string;
  handled: boolean;
  data?: {
    [key: string]: string | boolean;
  };
  synthetic?: boolean;
}
