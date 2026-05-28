import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { type CreateMeetingUseCase } from "../../application/use-cases/create-meeting.usecase.js";
import { type GetBootstrapUseCase } from "../../application/use-cases/get-bootstrap.usecase.js";
import { type IssueTokenUseCase } from "../../application/use-cases/issue-token.usecase.js";
import { type ValidateMeetingUseCase } from "../../application/use-cases/validate-meeting.usecase.js";
import { type Logger } from "../../domain/ports/logger.port.js";
import { buildErrorHandler } from "./middleware/error-handler.middleware.js";
import {
  buildRequestContextMiddleware,
  buildRequestLogger,
} from "./middleware/request-context.js";
import { buildBootstrapRouter } from "./routes/bootstrap.routes.js";
import { buildHealthRouter, type HealthInfo } from "./routes/health.routes.js";
import { buildMeetingRouter } from "./routes/meeting.routes.js";
import { buildTokenRouter } from "./routes/token.routes.js";

export interface HttpAppDeps {
  readonly env: "development" | "production" | "test";
  readonly logger: Logger;
  readonly cors: { readonly origins: readonly string[] };
  readonly rateLimit: { readonly windowMs: number; readonly max: number };
  readonly staticDir?: string | undefined;
  readonly health: HealthInfo;
  readonly issueToken: IssueTokenUseCase;
  readonly createMeeting: CreateMeetingUseCase;
  readonly validateMeeting: ValidateMeetingUseCase;
  readonly getBootstrap: GetBootstrapUseCase;
}

export function buildHttpApp(deps: HttpAppDeps): Express {
  const app = express();
  const isProduction = deps.env === "production";

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());

  const allowAll = deps.cors.origins.includes("*");
  app.use(
    cors({
      origin: allowAll
        ? true
        : (origin, cb) => {
            if (!origin || deps.cors.origins.includes(origin)) {
              cb(null, true);
              return;
            }
            cb(new Error(`Origin ${origin} not allowed by CORS`));
          },
      credentials: !allowAll,
    }),
  );

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));

  app.use(buildRequestContextMiddleware(deps.logger));
  app.use(buildRequestLogger());

  app.use(
    rateLimit({
      windowMs: deps.rateLimit.windowMs,
      limit: deps.rateLimit.max,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  if (deps.staticDir) {
    app.use(express.static(deps.staticDir, { index: false, maxAge: "1h" }));
  }

  app.use(buildHealthRouter(deps.health));
  app.use(buildBootstrapRouter({ getBootstrap: deps.getBootstrap }));
  app.use(buildTokenRouter({ issueToken: deps.issueToken }));
  app.use(
    buildMeetingRouter({
      createMeeting: deps.createMeeting,
      validateMeeting: deps.validateMeeting,
    }),
  );

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.originalUrl} not found`,
        requestId: req.id,
      },
    });
  });

  app.use(buildErrorHandler({ isProduction }));

  return app;
}
