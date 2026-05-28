import { type LogFields, type Logger } from "../../src/domain/ports/logger.port.js";

export class NullLogger implements Logger {
  trace(_fields: LogFields, _message?: string): void {}
  debug(_fields: LogFields, _message?: string): void {}
  info(_fields: LogFields, _message?: string): void {}
  warn(_fields: LogFields, _message?: string): void {}
  error(_fields: LogFields, _message?: string): void {}
  fatal(_fields: LogFields, _message?: string): void {}
  child(_bindings: LogFields): Logger {
    return this;
  }
}
