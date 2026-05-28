import request from "supertest";
import { describe, expect, it } from "vitest";
import { CreateMeetingUseCase } from "../../src/application/use-cases/create-meeting.usecase.js";
import { GetBootstrapUseCase } from "../../src/application/use-cases/get-bootstrap.usecase.js";
import { IssueTokenUseCase } from "../../src/application/use-cases/issue-token.usecase.js";
import { ValidateMeetingUseCase } from "../../src/application/use-cases/validate-meeting.usecase.js";
import { type Meeting } from "../../src/domain/entities/meeting.js";
import { type IssuedToken } from "../../src/domain/entities/token.js";
import { MeetingCreationFailed } from "../../src/domain/errors/video-provider.errors.js";
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
import { buildHttpApp } from "../../src/presentation/http/server.js";
import { NullLogger } from "../support/null-logger.js";

class StubIssuer implements TokenIssuer {
  async issue(_payload: TokenPayload, ttl: number): Promise<IssuedToken> {
    return Promise.resolve({
      value: "stub.jwt",
      expiresAt: new Date(Date.now() + ttl * 1000),
    });
  }
}

class StubProvider implements VideoProvider {
  constructor(
    private readonly behavior: {
      create?: (input: CreateMeetingInput) => Meeting | Error;
      validate?: (input: ValidateMeetingInput) => Meeting | Error;
    } = {},
  ) {}
  async createMeeting(input: CreateMeetingInput): Promise<Meeting> {
    const result = this.behavior.create?.(input);
    if (result instanceof Error) throw result;
    return Promise.resolve(
      result ?? {
        id: "stub-room-id",
        region: input.region ?? "sg001",
        createdAt: new Date(),
      },
    );
  }
  async validateMeeting(input: ValidateMeetingInput): Promise<Meeting> {
    const result = this.behavior.validate?.(input);
    if (result instanceof Error) throw result;
    return Promise.resolve(
      result ?? { id: input.meetingId, region: "sg001", createdAt: new Date() },
    );
  }
}

class StubRegistry implements MeetingRegistry {
  constructor(private meetingId: string | null = null) {}
  async setActive(meetingId: string): Promise<void> {
    this.meetingId = meetingId;
  }
  async getActive(): Promise<string | null> {
    return Promise.resolve(this.meetingId);
  }
  async clearActive(): Promise<void> {
    this.meetingId = null;
  }
}

function makeApp(
  provider: VideoProvider = new StubProvider(),
  registry: MeetingRegistry = new StubRegistry(),
) {
  const logger = new NullLogger();
  const issueToken = new IssueTokenUseCase(
    new StubIssuer(),
    { apiKey: "k", permissions: ["allow_join"], ttlSeconds: 60 },
    logger,
  );
  return buildHttpApp({
    env: "test",
    logger,
    cors: { origins: ["*"] },
    rateLimit: { windowMs: 60_000, max: 10_000 },
    health: { version: "0.0.0-test", startedAt: new Date() },
    issueToken,
    createMeeting: new CreateMeetingUseCase(provider, logger),
    validateMeeting: new ValidateMeetingUseCase(provider, logger),
    getBootstrap: new GetBootstrapUseCase(issueToken, registry),
  });
}

describe("HTTP integration", () => {
  it("GET / returns token + null meetingId when no bootstrap has run", async () => {
    const res = await request(makeApp()).get("/");
    expect(res.status).toBe(200);
    expect(res.body.token).toBe("stub.jwt");
    expect(res.body.meetingId).toBeNull();
    expect(res.body.joinUrl).toBeNull();
  });

  it("GET / surfaces the active meetingId once registry is populated", async () => {
    const registry = new StubRegistry("abc-xyz");
    const res = await request(makeApp(new StubProvider(), registry)).get("/");
    expect(res.status).toBe(200);
    expect(res.body.meetingId).toBe("abc-xyz");
    expect(res.body.joinUrl).toBe("/join.html?meetingId=abc-xyz");
  });

  it("GET /health returns ok and includes uptime + version", async () => {
    const res = await request(makeApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", version: "0.0.0-test" });
  });

  it("GET /get-token returns a token with ISO expiresAt", async () => {
    const res = await request(makeApp()).get("/get-token");
    expect(res.status).toBe(200);
    expect(res.body.token).toBe("stub.jwt");
    expect(typeof res.body.expiresAt).toBe("string");
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("POST /create-meeting returns 201 with meetingId", async () => {
    const res = await request(makeApp())
      .post("/create-meeting")
      .send({ token: "t", region: "sg001" });
    expect(res.status).toBe(201);
    expect(res.body.meetingId).toBe("stub-room-id");
    expect(res.body.region).toBe("sg001");
  });

  it("POST /create-meeting returns 400 on invalid body", async () => {
    const res = await request(makeApp())
      .post("/create-meeting")
      .send({ region: "sg001" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.requestId).toBeDefined();
  });

  it("POST /create-meeting maps provider error to 502", async () => {
    const failing = new StubProvider({
      create: () => new MeetingCreationFailed("upstream broke"),
    });
    const res = await request(makeApp(failing))
      .post("/create-meeting")
      .send({ token: "t" });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("MEETING_CREATION_FAILED");
  });

  it("POST /validate-meeting/:meetingId returns 200 with the resolved meeting", async () => {
    const res = await request(makeApp())
      .post("/validate-meeting/abc-xyz-123")
      .send({ token: "t" });
    expect(res.status).toBe(200);
    expect(res.body.meetingId).toBe("abc-xyz-123");
  });

  it("unknown route returns 404 with structured error", async () => {
    const res = await request(makeApp()).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("echoes the x-request-id header back", async () => {
    const reqId = "test-req-id-123";
    const res = await request(makeApp())
      .get("/health")
      .set("x-request-id", reqId);
    expect(res.headers["x-request-id"]).toBe(reqId);
  });
});
