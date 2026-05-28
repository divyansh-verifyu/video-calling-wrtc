import { Router } from "express";
import { type GetBootstrapUseCase } from "../../../application/use-cases/get-bootstrap.usecase.js";
import { type BootstrapResponseDto } from "../dto/bootstrap.dto.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function buildBootstrapRouter(deps: {
  getBootstrap: GetBootstrapUseCase;
}): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const info = await deps.getBootstrap.execute();
      const body: BootstrapResponseDto = {
        token: info.token.value,
        expiresAt: info.token.expiresAt.toISOString(),
        meetingId: info.meetingId,
        joinUrl:
          info.meetingId === null
            ? null
            : `/join.html?meetingId=${encodeURIComponent(info.meetingId)}`,
      };
      res.status(200).json(body);
    }),
  );

  return router;
}
