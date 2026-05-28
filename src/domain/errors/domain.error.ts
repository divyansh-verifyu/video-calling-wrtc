export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = new.target.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, new.target);
    }
  }

  toJSON(): { code: string; message: string } {
    return { code: this.code, message: this.message };
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  readonly httpStatus = 400;
  readonly issues: readonly { path: string; message: string }[];

  constructor(
    message: string,
    issues: readonly { path: string; message: string }[] = [],
  ) {
    super(message);
    this.issues = issues;
  }

  override toJSON(): {
    code: string;
    message: string;
    issues: readonly { path: string; message: string }[];
  } {
    return { code: this.code, message: this.message, issues: this.issues };
  }
}
