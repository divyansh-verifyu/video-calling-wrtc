import { type NextFunction, type Request, type Response } from "express";
import { v4 as uuid } from "uuid";
import { type Logger } from "../../../domain/ports/logger.port.js";

const REQUEST_ID_HEADER = "x-request-id";

declare module "express-serve-static-core" {
  interface Request {
    id: string;
    logger: Logger;
    startTime: number;
  }
}

export function buildRequestContextMiddleware(baseLogger: Logger) {
  return function requestContext(req: Request, res: Response, next: NextFunction): void {
    const headerId = req.header(REQUEST_ID_HEADER);
    const id = headerId && headerId.length <= 128 ? headerId : uuid();
    req.id = id;
    req.startTime = Date.now();
    req.logger = baseLogger.child({ requestId: id });
    res.setHeader("x-request-id", id);
    next();
  };
}

export function buildRequestLogger() {
  return function requestLogger(req: Request, res: Response, next: NextFunction): void {
    req.logger.info(
      { method: req.method, url: req.originalUrl, ip: req.ip },
      "request received",
    );
    res.on("finish", () => {
      const durationMs = Date.now() - req.startTime;
      req.logger.info(
        { status: res.statusCode, durationMs },
        "request completed",
      );
    });
    next();
  };
}
