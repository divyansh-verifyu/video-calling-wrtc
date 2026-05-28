import { type Meeting } from "../entities/meeting.js";

export interface CreateMeetingInput {
  readonly token: string;
  readonly region?: string | undefined;
}

export interface ValidateMeetingInput {
  readonly token: string;
  readonly meetingId: string;
}

export interface VideoProvider {
  createMeeting(input: CreateMeetingInput): Promise<Meeting>;
  validateMeeting(input: ValidateMeetingInput): Promise<Meeting>;
}
