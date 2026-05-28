import { type IssuedToken } from "../../domain/entities/token.js";
import { type MeetingRegistry } from "../../domain/ports/meeting-registry.port.js";
import { type IssueTokenUseCase } from "./issue-token.usecase.js";

export interface BootstrapInfo {
  readonly token: IssuedToken;
  readonly meetingId: string | null;
}

export class GetBootstrapUseCase {
  constructor(
    private readonly issueToken: IssueTokenUseCase,
    private readonly registry: MeetingRegistry,
  ) {}

  async execute(): Promise<BootstrapInfo> {
    const [token, meetingId] = await Promise.all([
      this.issueToken.execute(),
      this.registry.getActive(),
    ]);
    return { token, meetingId };
  }
}
