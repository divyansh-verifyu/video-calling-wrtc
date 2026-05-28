import { type Meeting } from "../../domain/entities/meeting.js";
import { type Logger } from "../../domain/ports/logger.port.js";
import {
  type ValidateMeetingInput,
  type VideoProvider,
} from "../../domain/ports/video-provider.port.js";

export class ValidateMeetingUseCase {
  constructor(
    private readonly provider: VideoProvider,
    private readonly logger: Logger,
  ) {}

  async execute(input: ValidateMeetingInput): Promise<Meeting> {
    this.logger.info({ meetingId: input.meetingId }, "validating meeting");
    return this.provider.validateMeeting(input);
  }
}
