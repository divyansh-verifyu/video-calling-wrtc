export interface BootstrapResponseDto {
  readonly token: string;
  readonly expiresAt: string;
  readonly meetingId: string | null;
  readonly joinUrl: string | null;
}
