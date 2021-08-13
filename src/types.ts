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
  platform?: string;
  release?: string;
  environment?: string;
  fingerprint?: string[];
  contexts?: Contexts;
  tags?: { [key: string]: Primitive };
  extra?: Extras;
  user?: User;
} & ErrorEventInput;

export interface SdkInfo {
  name: string;
  version: string;
}

export interface Options {
  endpoint: string;
  session?: Session;
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

export type Context = Record<string, unknown>;
export type Contexts = Record<string, Context>;

export type Primitive = number | string | boolean | bigint | symbol | null | undefined;

export type Extra = unknown;
export type Extras = Record<string, Extra>;

export interface User {
  [key: string]: any;
  id?: string;
  ip_address?: string;
  email?: string;
  username?: string;
}

export interface Session {
  sid: string;
  status: SessionStatus;
  init: boolean;
  errors: bigint;
}

export enum SessionStatus {
  Ok = 'ok',
  Exited = 'exited',
  Crashed = 'crashed',
  Abnormal = 'abnormal',
}
