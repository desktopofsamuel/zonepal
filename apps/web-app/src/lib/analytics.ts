import { PostHog } from 'posthog-js';

// Event categories
export enum EventCategory {
  TIMEZONE = 'timezone',
  BLOCKED_HOURS = 'blocked_hours',
  SETTINGS = 'settings',
  UI = 'ui',
}

// Event actions
export enum EventAction {
  ADD = 'add',
  REMOVE = 'remove',
  UPDATE = 'update',
  SORT = 'sort',
  TOGGLE = 'toggle',
  CHANGE = 'change',
  RESET = 'reset',
}

// Event properties interface
export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined | string[] | number[] | Record<string, unknown>;
}

/**
 * Track an event in PostHog with a structured naming convention
 * @param posthog PostHog instance
 * @param category Event category (e.g., 'timezone', 'blocked_hours')
 * @param action Event action (e.g., 'add', 'remove', 'update')
 * @param properties Additional properties to track
 */
export function trackEvent(
  posthog: PostHog | null,
  category: EventCategory,
  action: EventAction,
  properties: EventProperties = {}
): void {
  if (!posthog) return;

  const eventName = `${category}.${action}`;
  
  // Add timestamp to all events
  const eventProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
  };

  // Log the event to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, eventProperties);
  }

  // Send the event to PostHog
  posthog.capture(eventName, eventProperties);
} 