import { z } from "zod";

export const validateMeetingParamsSchema = z.object({
  meetingId: z
    .string()
    .min(1, "meetingId is required")
    .max(128, "meetingId is too long"),
});

export const validateMeetingBodySchema = z.object({
  token: z.string().min(1, "token is required"),
});

export type ValidateMeetingParams = z.infer<typeof validateMeetingParamsSchema>;
export type ValidateMeetingBody = z.infer<typeof validateMeetingBodySchema>;
