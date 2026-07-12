export interface BlockedTimeSlot {
  start: number; // Hour in 24-hour format (0-23)
  end: number; // Hour in 24-hour format (0-23)
  ianaName?: string; // Optional: specific timezone. If not provided, applies to all
}

export interface TimelineSettings {
  blockedTimeSlots: BlockedTimeSlot[];
  defaultBlockedHours: {
    start: number;
    end: number;
  };
  referenceTimezone: string; // The timezone to use as reference for blocked hours
} 