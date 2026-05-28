import { z } from "zod";

export const createMeetingBodySchema = z.object({
  token: z.string().min(1, "token is required"),
  region: z.string().min(1).optional(),
});

export type CreateMeetingBody = z.infer<typeof createMeetingBodySchema>;
