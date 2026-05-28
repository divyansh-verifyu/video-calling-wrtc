export interface MeetingRegistry {
  setActive(meetingId: string): Promise<void>;
  getActive(): Promise<string | null>;
  clearActive(): Promise<void>;
}
