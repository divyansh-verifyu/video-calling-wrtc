import { Router } from "express";
import { type IssueTokenUseCase } from "../../../application/use-cases/issue-token.usecase.js";
import { type IssueTokenResponseDto } from "../dto/token.dto.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function buildTokenRouter(deps: { issueToken: IssueTokenUseCase }): Router {
  const router = Router();

  router.get(
    "/get-token",
    asyncHandler(async (_req, res) => {
      const issued = await deps.issueToken.execute();
      const body: IssueTokenResponseDto = {
        token: issued.value,
        expiresAt: issued.expiresAt.toISOString(),
      };
      res.status(200).json(body);
    }),
  );

  return router;
}
