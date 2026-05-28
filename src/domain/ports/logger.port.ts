export type LogFields = Readonly<Record<string, unknown>>;

export interface Logger {
  trace(fields: LogFields, message?: string): void;
  debug(fields: LogFields, message?: string): void;
  info(fields: LogFields, message?: string): void;
  warn(fields: LogFields, message?: string): void;
  error(fields: LogFields, message?: string): void;
  fatal(fields: LogFields, message?: string): void;
  child(bindings: LogFields): Logger;
}
