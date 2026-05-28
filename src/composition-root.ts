import { type Express } from "express";
import { CreateMeetingUseCase } from "./application/use-cases/create-meeting.usecase.js";
import { GetBootstrapUseCase } from "./application/use-cases/get-bootstrap.usecase.js";
import { IssueTokenUseCase } from "./application/use-cases/issue-token.usecase.js";
import { StartBootstrapUseCase } from "./application/use-cases/start-bootstrap.usecase.js";
import { ValidateMeetingUseCase } from "./application/use-cases/validate-meeting.usecase.js";
import { type Logger } from "./domain/ports/logger.port.js";
import { JwtTokenIssuer } from "./infrastructure/auth/jwt-token-issuer.js";
import { type Config } from "./infrastructure/config/env.schema.js";
import { FetchHttpClient } from "./infrastructure/http/fetch-http-client.js";
import { PinoLogger } from "./infrastructure/logging/pino-logger.js";
import { InMemoryMeetingRegistry } from "./infrastructure/registry/in-memory-meeting-registry.js";
import { VideoSdkProvider } from "./infrastructure/video/videosdk-provider.js";
import { buildHttpApp } from "./presentation/http/server.js";

export interface ComposedApp {
  readonly app: Express;
  readonly logger: Logger;
  readonly startBootstrap: StartBootstrapUseCase;
}

export interface ComposeOptions {
  readonly version: string;
  readonly staticDir?: string | undefined;
}

export function compose(config: Config, options: ComposeOptions): ComposedApp {
  const logger: Logger = new PinoLogger(config);

  const http = new FetchHttpClient(
    {
      defaultTimeoutMs: config.HTTP_TIMEOUT_MS,
      defaultRetryAttempts: config.HTTP_RETRY_ATTEMPTS,
    },
    logger.child({ component: "http-client" }),
  );

  const provider = new VideoSdkProvider(http, {
    endpoint: config.VIDEOSDK_API_ENDPOINT,
    defaultRegion: config.VIDEOSDK_DEFAULT_REGION,
  });

  const issuer = new JwtTokenIssuer({ secret: config.VIDEOSDK_SECRET_KEY });
  const registry = new InMemoryMeetingRegistry();

  const issueToken = new IssueTokenUseCase(
    issuer,
    {
      apiKey: config.VIDEOSDK_API_KEY,
      permissions: config.TOKEN_PERMISSIONS,
      ttlSeconds: config.TOKEN_TTL_SECONDS,
    },
    logger.child({ usecase: "issue-token" }),
  );
  const createMeeting = new CreateMeetingUseCase(
    provider,
    logger.child({ usecase: "create-meeting" }),
  );
  const validateMeeting = new ValidateMeetingUseCase(
    provider,
    logger.child({ usecase: "validate-meeting" }),
  );
  const getBootstrap = new GetBootstrapUseCase(issueToken, registry);
  const startBootstrap = new StartBootstrapUseCase(
    issueToken,
    createMeeting,
    registry,
    logger.child({ usecase: "start-bootstrap" }),
  );

  const app = buildHttpApp({
    env: config.NODE_ENV,
    logger,
    cors: { origins: config.CORS_ORIGINS },
    rateLimit: {
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX,
    },
    staticDir: options.staticDir,
    health: { version: options.version, startedAt: new Date() },
    issueToken,
    createMeeting,
    validateMeeting,
    getBootstrap,
  });

  return { app, logger, startBootstrap };
}
