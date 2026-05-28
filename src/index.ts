import "dotenv/config";
import { readFileSync } from "node:fs";
import { type Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type StartBootstrapUseCase } from "./application/use-cases/start-bootstrap.usecase.js";
import { compose } from "./composition-root.js";
import { type Logger } from "./domain/ports/logger.port.js";
import {
  EnvValidationError,
  loadConfig,
} from "./infrastructure/config/env.js";

interface PackageJson {
  readonly version: string;
}

function resolvePaths(): { version: string; staticDir: string } {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(dirname, "..");
  const pkg = JSON.parse(
    readFileSync(path.join(projectRoot, "package.json"), "utf-8"),
  ) as PackageJson;
  return {
    version: pkg.version,
    staticDir: path.join(projectRoot, "public"),
  };
}

function runBootstrap(
  startBootstrap: StartBootstrapUseCase,
  logger: Logger,
  publicBaseUrl: string,
): void {
  startBootstrap
    .execute()
    .then(({ token, meetingId }) => {
      const joinUrl = `${publicBaseUrl}/join.html?meetingId=${encodeURIComponent(meetingId)}`;
      const banner = [
        "",
        "================================================================================",
        "  BOOTSTRAP MEETING READY",
        "  Meeting ID : " + meetingId,
        "  Token      : " + token.value,
        "  Token TTL  : expires at " + token.expiresAt.toISOString(),
        "  Join URL   : " + joinUrl,
        "================================================================================",
        "",
      ].join("\n");
      console.log(banner);
    })
    .catch((err: unknown) => {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        "bootstrap failed; server is up but / will return meetingId=null",
      );
    });
}

function main(): void {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof EnvValidationError) {
      console.error(err.message);
    } else {
      console.error("Failed to load configuration:", err);
    }
    process.exit(1);
  }

  const { version, staticDir } = resolvePaths();
  const { app, logger, startBootstrap } = compose(config, {
    version,
    staticDir,
  });

  const server: Server = app.listen(config.PORT, config.HOST, () => {
    logger.info(
      {
        host: config.HOST,
        port: config.PORT,
        env: config.NODE_ENV,
        version,
      },
      "API server listening",
    );

    if (config.BOOTSTRAP_MEETING_ON_START) {
      const host =
        config.HOST === "0.0.0.0" || config.HOST === "::"
          ? "localhost"
          : config.HOST;
      const publicBaseUrl = `http://${host}:${String(config.PORT)}`;
      runBootstrap(startBootstrap, logger, publicBaseUrl);
    } else {
      logger.info(
        {},
        "BOOTSTRAP_MEETING_ON_START is false — skipping startup meeting",
      );
    }
  });

  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info({ signal }, "shutdown initiated, draining requests");
    const forceExitTimer = setTimeout(() => {
      logger.error(
        { timeoutMs: config.SHUTDOWN_TIMEOUT_MS },
        "graceful shutdown timed out, forcing exit",
      );
      process.exit(1);
    }, config.SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    server.close((err) => {
      if (err) {
        logger.error({ err: err.message }, "error during server close");
        process.exit(1);
      }
      logger.info({}, "shutdown complete");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });

  process.on("unhandledRejection", (reason) => {
    logger.fatal(
      { reason: reason instanceof Error ? reason.message : String(reason) },
      "unhandled promise rejection",
    );
    process.exit(1);
  });
  process.on("uncaughtException", (err) => {
    logger.fatal({ err: err.message, stack: err.stack }, "uncaught exception");
    process.exit(1);
  });
}

try {
  main();
} catch (err: unknown) {
  console.error("Fatal boot error:", err);
  process.exit(1);
}
