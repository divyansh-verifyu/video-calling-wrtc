import { describe, expect, it } from "vitest";
import { CreateMeetingUseCase } from "../../src/application/use-cases/create-meeting.usecase.js";
import { type Meeting } from "../../src/domain/entities/meeting.js";
import { MeetingCreationFailed } from "../../src/domain/errors/video-provider.errors.js";
import {
  type CreateMeetingInput,
  type ValidateMeetingInput,
  type VideoProvider,
} from "../../src/domain/ports/video-provider.port.js";
import { NullLogger } from "../support/null-logger.js";

class FakeProvider implements VideoProvider {
  public lastInput: CreateMeetingInput | null = null;
  constructor(private readonly responder: (input: CreateMeetingInput) => Meeting | Promise<Meeting>) {}
  async createMeeting(input: CreateMeetingInput): Promise<Meeting> {
    this.lastInput = input;
    return Promise.resolve(this.responder(input));
  }
  async validateMeeting(_input: ValidateMeetingInput): Promise<Meeting> {
    throw new Error("not used");
  }
}

describe("CreateMeetingUseCase", () => {
  it("delegates to provider and returns the meeting", async () => {
    const fake = new FakeProvider(() => ({
      id: "abcd-efgh-ijkl",
      region: "sg001",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    }));
    const useCase = new CreateMeetingUseCase(fake, new NullLogger());

    const meeting = await useCase.execute({ token: "tok", region: "sg001" });

    expect(fake.lastInput).toEqual({ token: "tok", region: "sg001" });
    expect(meeting.id).toBe("abcd-efgh-ijkl");
  });

  it("propagates provider errors unchanged", async () => {
    const fake = new FakeProvider(() => {
      throw new MeetingCreationFailed("upstream broke");
    });
    const useCase = new CreateMeetingUseCase(fake, new NullLogger());

    await expect(useCase.execute({ token: "tok" })).rejects.toBeInstanceOf(
      MeetingCreationFailed,
    );
  });
});
