import { Router } from "express";

export interface HealthInfo {
  readonly version: string;
  readonly startedAt: Date;
}

export function buildHealthRouter(info: HealthInfo): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      version: info.version,
      startedAt: info.startedAt.toISOString(),
      uptimeSeconds: Math.round((Date.now() - info.startedAt.getTime()) / 1000),
    });
  });

  return router;
}
