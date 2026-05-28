import { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import {
  DomainError,
  ValidationError,
} from "../../../domain/errors/domain.error.js";

export interface ErrorResponseBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
    readonly issues?: readonly { path: string; message: string }[];
  };
}

export function buildErrorHandler(opts: { isProduction: boolean }) {
  return function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    const requestId = req.id;

    if (err instanceof ZodError) {
      const issues = err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      const body: ErrorResponseBody = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          requestId,
          issues,
        },
      };
      req.logger.warn({ issues }, "validation error");
      res.status(400).json(body);
      return;
    }

    if (err instanceof ValidationError) {
      const body: ErrorResponseBody = {
        error: {
          code: err.code,
          message: err.message,
          requestId,
          issues: err.issues,
        },
      };
      req.logger.warn({ issues: err.issues }, "domain validation error");
      res.status(err.httpStatus).json(body);
      return;
    }

    if (err instanceof DomainError) {
      const body: ErrorResponseBody = {
        error: { code: err.code, message: err.message, requestId },
      };
      req.logger.warn(
        { code: err.code, status: err.httpStatus },
        "domain error",
      );
      res.status(err.httpStatus).json(body);
      return;
    }

    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    req.logger.error(
      {
        err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      },
      "unhandled error",
    );
    const body: ErrorResponseBody = {
      error: {
        code: "INTERNAL_ERROR",
        message: opts.isProduction ? "Internal server error" : message,
        requestId,
      },
    };
    res.status(500).json(body);
  };
}
