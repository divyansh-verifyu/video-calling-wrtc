import { pino, type Logger as PinoInstance } from "pino";
import { type LogFields, type Logger } from "../../domain/ports/logger.port.js";
import { type Config } from "../config/env.schema.js";

export class PinoLogger implements Logger {
  private readonly pino: PinoInstance;

  constructor(configOrInstance: Config | PinoInstance) {
    if ("level" in configOrInstance && "child" in configOrInstance) {
      this.pino = configOrInstance;
    } else {
      this.pino = pino({
        level: configOrInstance.LOG_LEVEL,
        base: { env: configOrInstance.NODE_ENV },
        timestamp: pino.stdTimeFunctions.isoTime,
        redact: {
          paths: ["req.headers.authorization", "*.token", "*.password"],
          censor: "[REDACTED]",
        },
      });
    }
  }

  trace(fields: LogFields, message?: string): void {
    this.pino.trace(fields, message);
  }
  debug(fields: LogFields, message?: string): void {
    this.pino.debug(fields, message);
  }
  info(fields: LogFields, message?: string): void {
    this.pino.info(fields, message);
  }
  warn(fields: LogFields, message?: string): void {
    this.pino.warn(fields, message);
  }
  error(fields: LogFields, message?: string): void {
    this.pino.error(fields, message);
  }
  fatal(fields: LogFields, message?: string): void {
    this.pino.fatal(fields, message);
  }
  child(bindings: LogFields): Logger {
    return new PinoLogger(this.pino.child(bindings));
  }

  raw(): PinoInstance {
    return this.pino;
  }
}
