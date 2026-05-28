import { type Meeting } from "../../domain/entities/meeting.js";
import { type Logger } from "../../domain/ports/logger.port.js";
import {
  type CreateMeetingInput,
  type VideoProvider,
} from "../../domain/ports/video-provider.port.js";

export class CreateMeetingUseCase {
  constructor(
    private readonly provider: VideoProvider,
    private readonly logger: Logger,
  ) {}

  async execute(input: CreateMeetingInput): Promise<Meeting> {
    this.logger.info({ region: input.region ?? null }, "creating meeting");
    const meeting = await this.provider.createMeeting(input);
    this.logger.info({ meetingId: meeting.id }, "meeting created");
    return meeting;
  }
}
