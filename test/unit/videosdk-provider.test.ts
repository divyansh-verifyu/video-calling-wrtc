import { describe, expect, it } from "vitest";
import {
  MeetingCreationFailed,
  MeetingValidationFailed,
  UpstreamUnauthorized,
} from "../../src/domain/errors/video-provider.errors.js";
import {
  type HttpClient,
  type HttpRequest,
  type HttpResponse,
} from "../../src/domain/ports/http-client.port.js";
import { VideoSdkProvider } from "../../src/infrastructure/video/videosdk-provider.js";

const opts = {
  endpoint: "https://api.test",
  defaultRegion: "sg001",
} as const;

const stub = (resp: HttpResponse<unknown>): HttpClient => ({
  request: async <T>(_req: HttpRequest): Promise<HttpResponse<T>> =>
    Promise.resolve(resp as HttpResponse<T>),
});

describe("VideoSdkProvider", () => {
  it("returns a Meeting on 2xx with roomId", async () => {
    const provider = new VideoSdkProvider(
      stub({ status: 200, headers: {}, body: { roomId: "abc-xyz" } }),
      opts,
    );
    const meeting = await provider.createMeeting({ token: "t" });
    expect(meeting.id).toBe("abc-xyz");
    expect(meeting.region).toBe("sg001");
  });

  it("maps 401 to UpstreamUnauthorized on createMeeting", async () => {
    const provider = new VideoSdkProvider(
      stub({ status: 401, headers: {}, body: { error: "no" } }),
      opts,
    );
    await expect(provider.createMeeting({ token: "t" })).rejects.toBeInstanceOf(
      UpstreamUnauthorized,
    );
  });

  it("maps non-2xx to MeetingCreationFailed", async () => {
    const provider = new VideoSdkProvider(
      stub({ status: 500, headers: {}, body: { error: "boom" } }),
      opts,
    );
    await expect(provider.createMeeting({ token: "t" })).rejects.toBeInstanceOf(
      MeetingCreationFailed,
    );
  });

  it("maps 404 to MeetingValidationFailed on validateMeeting", async () => {
    const provider = new VideoSdkProvider(
      stub({ status: 404, headers: {}, body: { error: "missing" } }),
      opts,
    );
    await expect(
      provider.validateMeeting({ token: "t", meetingId: "x" }),
    ).rejects.toBeInstanceOf(MeetingValidationFailed);
  });
});
