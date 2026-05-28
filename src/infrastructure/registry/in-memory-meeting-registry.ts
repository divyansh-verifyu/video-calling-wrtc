import { type MeetingRegistry } from "../../domain/ports/meeting-registry.port.js";

export class InMemoryMeetingRegistry implements MeetingRegistry {
  private active: string | null = null;

  setActive(meetingId: string): Promise<void> {
    this.active = meetingId;
    return Promise.resolve();
  }

  getActive(): Promise<string | null> {
    return Promise.resolve(this.active);
  }

  clearActive(): Promise<void> {
    this.active = null;
    return Promise.resolve();
  }
}
