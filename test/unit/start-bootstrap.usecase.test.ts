import { describe, expect, it } from "vitest";
import { CreateMeetingUseCase } from "../../src/application/use-cases/create-meeting.usecase.js";
import { IssueTokenUseCase } from "../../src/application/use-cases/issue-token.usecase.js";
import { StartBootstrapUseCase } from "../../src/application/use-cases/start-bootstrap.usecase.js";
import { type Meeting } from "../../src/domain/entities/meeting.js";
import { type IssuedToken } from "../../src/domain/entities/token.js";
import { type MeetingRegistry } from "../../src/domain/ports/meeting-registry.port.js";
import {
  type TokenIssuer,
  type TokenPayload,
} from "../../src/domain/ports/token-issuer.port.js";
import {
  type CreateMeetingInput,
  type ValidateMeetingInput,
  type VideoProvider,
} from "../../src/domain/ports/video-provider.port.js";
import { InMemoryMeetingRegistry } from "../../src/infrastructure/registry/in-memory-meeting-registry.js";
import { NullLogger } from "../support/null-logger.js";

class FakeIssuer implements TokenIssuer {
  async issue(_payload: TokenPayload, ttl: number): Promise<IssuedToken> {
    return Promise.resolve({
      value: "boot.jwt",
      expiresAt: new Date(Date.now() + ttl * 1000),
    });
  }
}

class FakeProvider implements VideoProvider {
  async createMeeting(_input: CreateMeetingInput): Promise<Meeting> {
    return Promise.resolve({
      id: "bootstrap-meeting-1",
      region: "sg001",
      createdAt: new Date(),
    });
  }
  async validateMeeting(_input: ValidateMeetingInput): Promise<Meeting> {
    throw new Error("not used");
  }
}

describe("StartBootstrapUseCase", () => {
  it("issues a token, creates a meeting, and stores the id in the registry", async () => {
    const registry: MeetingRegistry = new InMemoryMeetingRegistry();
    const logger = new NullLogger();
    const issueToken = new IssueTokenUseCase(
      new FakeIssuer(),
      { apiKey: "k", permissions: ["allow_join"], ttlSeconds: 60 },
      logger,
    );
    const createMeeting = new CreateMeetingUseCase(new FakeProvider(), logger);
    const startBootstrap = new StartBootstrapUseCase(
      issueToken,
      createMeeting,
      registry,
      logger,
    );

    const result = await startBootstrap.execute();

    expect(result.meetingId).toBe("bootstrap-meeting-1");
    expect(result.token.value).toBe("boot.jwt");
    expect(await registry.getActive()).toBe("bootstrap-meeting-1");
  });
});
