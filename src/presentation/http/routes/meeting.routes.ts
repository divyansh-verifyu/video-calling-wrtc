import { Router } from "express";
import { type CreateMeetingUseCase } from "../../../application/use-cases/create-meeting.usecase.js";
import { type ValidateMeetingUseCase } from "../../../application/use-cases/validate-meeting.usecase.js";
import { type MeetingDto } from "../dto/meeting.dto.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { createMeetingBodySchema } from "../validators/create-meeting.schema.js";
import {
  validateMeetingBodySchema,
  validateMeetingParamsSchema,
} from "../validators/validate-meeting.schema.js";

export function buildMeetingRouter(deps: {
  createMeeting: CreateMeetingUseCase;
  validateMeeting: ValidateMeetingUseCase;
}): Router {
  const router = Router();

  router.post(
    "/create-meeting",
    asyncHandler(async (req, res) => {
      const body = createMeetingBodySchema.parse(req.body);
      const meeting = await deps.createMeeting.execute({
        token: body.token,
        region: body.region,
      });
      const dto: MeetingDto = {
        meetingId: meeting.id,
        region: meeting.region,
        createdAt: meeting.createdAt.toISOString(),
      };
      res.status(201).json(dto);
    }),
  );

  router.post(
    "/validate-meeting/:meetingId",
    asyncHandler(async (req, res) => {
      const params = validateMeetingParamsSchema.parse(req.params);
      const body = validateMeetingBodySchema.parse(req.body);
      const meeting = await deps.validateMeeting.execute({
        token: body.token,
        meetingId: params.meetingId,
      });
      const dto: MeetingDto = {
        meetingId: meeting.id,
        region: meeting.region,
        createdAt: meeting.createdAt.toISOString(),
      };
      res.status(200).json(dto);
    }),
  );

  return router;
}
