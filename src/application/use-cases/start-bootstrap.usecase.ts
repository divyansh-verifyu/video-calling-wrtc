import { type IssuedToken } from "../../domain/entities/token.js";
import { type Logger } from "../../domain/ports/logger.port.js";
import { type MeetingRegistry } from "../../domain/ports/meeting-registry.port.js";
import { type CreateMeetingUseCase } from "./create-meeting.usecase.js";
import { type IssueTokenUseCase } from "./issue-token.usecase.js";

export interface BootstrapResult {
  readonly token: IssuedToken;
  readonly meetingId: string;
}

export class StartBootstrapUseCase {
  constructor(
    private readonly issueToken: IssueTokenUseCase,
    private readonly createMeeting: CreateMeetingUseCase,
    private readonly registry: MeetingRegistry,
    private readonly logger: Logger,
  ) {}

  async execute(): Promise<BootstrapResult> {
    this.logger.info({}, "bootstrap: issuing token + creating meeting");
    const token = await this.issueToken.execute();
    const meeting = await this.createMeeting.execute({ token: token.value });
    await this.registry.setActive(meeting.id);
    this.logger.info(
      { meetingId: meeting.id, expiresAt: token.expiresAt.toISOString() },
      "bootstrap: ready",
    );
    return { token, meetingId: meeting.id };
  }
}
