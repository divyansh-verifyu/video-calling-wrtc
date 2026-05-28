import { type Meeting } from "../../domain/entities/meeting.js";
import {
  MeetingCreationFailed,
  MeetingValidationFailed,
  UpstreamUnauthorized,
} from "../../domain/errors/video-provider.errors.js";
import { type HttpClient } from "../../domain/ports/http-client.port.js";
import {
  type CreateMeetingInput,
  type ValidateMeetingInput,
  type VideoProvider,
} from "../../domain/ports/video-provider.port.js";

export interface VideoSdkProviderOptions {
  readonly endpoint: string;
  readonly defaultRegion: string;
}

interface VideoSdkMeetingResponse {
  readonly roomId?: string;
  readonly meetingId?: string;
  readonly region?: string;
  readonly [key: string]: unknown;
}

export class VideoSdkProvider implements VideoProvider {
  constructor(
    private readonly http: HttpClient,
    private readonly options: VideoSdkProviderOptions,
  ) {}

  async createMeeting(input: CreateMeetingInput): Promise<Meeting> {
    const region = input.region ?? this.options.defaultRegion;
    const url = `${this.options.endpoint}/api/meetings`;

    const response = await this.http.request<VideoSdkMeetingResponse>({
      method: "POST",
      url,
      headers: { Authorization: input.token },
      body: { region },
    });

    if (response.status === 401 || response.status === 403) {
      throw new UpstreamUnauthorized(
        `VideoSDK rejected the token (${String(response.status)})`,
      );
    }
    if (response.status < 200 || response.status >= 300) {
      throw new MeetingCreationFailed(
        `VideoSDK createMeeting failed with status ${String(response.status)}`,
        response.body,
      );
    }

    const id = response.body.roomId ?? response.body.meetingId;
    if (!id) {
      throw new MeetingCreationFailed(
        "VideoSDK response did not include roomId/meetingId",
        response.body,
      );
    }

    return {
      id,
      region: response.body.region ?? region,
      createdAt: new Date(),
      raw: response.body,
    };
  }

  async validateMeeting(input: ValidateMeetingInput): Promise<Meeting> {
    const url = `${this.options.endpoint}/api/meetings/${encodeURIComponent(input.meetingId)}`;

    const response = await this.http.request<VideoSdkMeetingResponse>({
      method: "POST",
      url,
      headers: { Authorization: input.token },
    });

    if (response.status === 401 || response.status === 403) {
      throw new UpstreamUnauthorized(
        `VideoSDK rejected the token (${String(response.status)})`,
      );
    }
    if (response.status === 404) {
      throw new MeetingValidationFailed(
        `Meeting ${input.meetingId} not found`,
        response.body,
      );
    }
    if (response.status < 200 || response.status >= 300) {
      throw new MeetingValidationFailed(
        `VideoSDK validateMeeting failed with status ${String(response.status)}`,
        response.body,
      );
    }

    const id = response.body.roomId ?? response.body.meetingId ?? input.meetingId;
    return {
      id,
      region: response.body.region ?? null,
      createdAt: new Date(),
      raw: response.body,
    };
  }
}
