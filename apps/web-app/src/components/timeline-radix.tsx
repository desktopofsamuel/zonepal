import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'
import * as Slider from '@radix-ui/react-slider'
import { BlockedTimeSlot } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePostHog } from 'posthog-js/react'
import { trackEvent, EventCategory, EventAction } from '@/lib/analytics'

// Create sets to track logged items across all component instances
// This helps reduce duplicate logs
const loggedConversions = new Set<string>();
const loggedHourChecks = new Set<string>();

interface TimelineRadixProps {
  ianaName: string;
  onTimeChange?: (newDate: Date) => void;
  selectedDate: Date;
  use24Hour?: boolean;
  blockedTimeSlots?: BlockedTimeSlot[];
  defaultBlockedHours: { start: number; end: number };
  referenceTimezone: string; // Kept for future use but currently using local time only
}

// Constants for different screen sizes
const MARKERS = {
  mobile: Array.from({ length: 7 }, (_, i) => i * 4), // 0, 4, 8, 12, 16, 20
  desktop: Array.from({ length: 13 }, (_, i) => i * 2), // 0, 2, 4, ..., 22, 24
};

const LABELS = {
  mobile: [0, 6, 12, 18, 24], // Include both 0 and 24 for 12am
  desktop: [0, 4, 8, 12, 16, 20, 24], // Include both 0 and 24 for 12am
};

export function TimelineRadix({ 
  ianaName, 
  onTimeChange, 
  selectedDate, 
  use24Hour = false,
  blockedTimeSlots = [],
  defaultBlockedHours,
  referenceTimezone // eslint-disable-line @typescript-eslint/no-unused-vars -- Kept for future reference-based functionality
}: TimelineRadixProps) {
  const posthog = usePostHog();
  const [position, setPosition] = useState(50)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [lastTrackedPosition, setLastTrackedPosition] = useState<number | null>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Convert position to time in the target timezone
  const positionToTime = useCallback((pos: number): Date => {
    try {
      // Calculate hours and minutes from position (0-100% maps to 0-24 hours)
      const totalHours = (pos / 100) * 24
      const hours = Math.floor(totalHours)
      const minutes = Math.round((totalHours % 1) * 60)

      // Get the current date in the target timezone
      const targetDate = toZonedTime(selectedDate, ianaName)
      
      // Get the timezone offset for the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: ianaName,
        timeZoneName: 'shortOffset'
      })
      const parts = formatter.formatToParts(targetDate)
      const offsetStr = parts.find(part => part.type === 'timeZoneName')?.value || ''
      const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::?(\d{2})?)?/)
      
      let offsetHours = 0
      let offsetMinutes = 0
      if (match) {
        const [, sign, hours, minutes = '00'] = match
        offsetHours = parseInt(hours) * (sign === '+' ? 1 : -1)
        offsetMinutes = parseInt(minutes) * (sign === '+' ? 1 : -1)
      }

      // Create a new UTC date with the target time adjusted for the timezone
      return new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        hours - offsetHours,
        minutes - offsetMinutes,
        0,
        0
      ))
    } catch (error) {
      return selectedDate
    }
  }, [selectedDate, ianaName])

  // Convert time to position
  const timeToPosition = useCallback((date: Date): number => {
    try {
      // Convert the date to the target timezone
      const zonedDate = toZonedTime(date, ianaName)
      
      // Get hours and minutes in the target timezone
      const totalHours = zonedDate.getHours() + (zonedDate.getMinutes() / 60)
      
      // Calculate position as percentage of day
      const position = (totalHours / 24) * 100
      
      return Math.max(0, Math.min(100, position))
    } catch (error) {
      return 0
    }
  }, [ianaName])

  // Initialize position based on selected date
  useEffect(() => {
    const newPosition = timeToPosition(selectedDate)
    setPosition(newPosition)
  }, [selectedDate, timeToPosition])

  const handleValueChange = useCallback((values: number[]) => {
    const newPosition = values[0]
    setPosition(newPosition)
    const newTime = positionToTime(newPosition)
    onTimeChange?.(newTime)
  }, [positionToTime, onTimeChange])

  // Track when user starts dragging the timeline
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setLastTrackedPosition(position);
    
    trackEvent(posthog, EventCategory.UI, EventAction.TOGGLE, {
      action: 'timeline_drag_start',
      timezone: ianaName,
      position: position,
      hour: Math.floor((position / 100) * 24)
    });
  }, [position, ianaName, posthog]);

  // Convert hours from reference timezone to current timezone
  // Currently not used with local time blocks, but kept for future reference-based functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const convertBlockedHours = useCallback((hour: number, fromTimezone: string, toTimezone: string): number => {
    try {
      // If the timezones are the same, no conversion needed
      if (fromTimezone === toTimezone) {
        return hour;
      }
      
      // Only log for specific hours (0, 6, 12, 18, 22) to reduce noise
      // AND only log the first occurrence of each hour conversion to further reduce logs
      const conversionKey = `${hour}:${fromTimezone}:${toTimezone}`;
      const shouldLog = [0, 6, 12, 18, 22].includes(hour) && !loggedConversions.has(conversionKey);
      
      if (shouldLog) {
        console.log(`Converting hour ${hour} from ${fromTimezone} to ${toTimezone}`);
        loggedConversions.add(conversionKey);
      }
      
      // Create a date object for today at the specified hour in the source timezone
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();
      
      // Create a date with the hour in the source timezone
      const sourceDate = new Date(Date.UTC(year, month, day, hour, 0, 0));
      
      // Convert to the source timezone first
      const sourceInSourceTz = toZonedTime(sourceDate, fromTimezone);
      
      // Then format in the target timezone to get the hour
      const convertedTime = formatInTimeZone(sourceInSourceTz, toTimezone, 'HH');
      const result = parseInt(convertedTime, 10);
      
      if (shouldLog) {
        console.log(`Converted result: ${hour} in ${fromTimezone} => ${result} in ${toTimezone}`);
      }
      return result;
    } catch (error) {
      console.error('Error converting timezone hours:', error);
      return hour;
    }
  }, []);

  // Function to check if a given hour is active (not blocked)
  const isHourActive = useCallback((hour: number) => {
    // Track which hours we've already logged to prevent duplicate logs
    const hourCheckKey = `${hour}:${ianaName}`;
    
    // Only log for specific hours (0, 6, 12, 18) to reduce noise
    // AND only log the first check for each hour/timezone combination
    if ([0, 6, 12, 18].includes(hour) && !loggedHourChecks.has(hourCheckKey)) {
      console.log(`Checking if hour ${hour} is active in ${ianaName} (local time)`);
      loggedHourChecks.add(hourCheckKey);
    }
    
    // First check timezone-specific blocks
    const tzSpecificBlocks = blockedTimeSlots.filter(slot => slot.ianaName === ianaName);
    const globalBlocks = blockedTimeSlots.filter(slot => !slot.ianaName);
    
    // Check if hour is within any timezone-specific block - using local time
    const isBlockedBySpecific = tzSpecificBlocks.some(slot => {
      const start = slot.start;
      const end = slot.end;
      
      if (start <= end) {
        return hour >= start && hour < end;
      } else {
        // Handle overnight blocks (e.g., 18-9)
        return hour >= start || hour < end;
      }
    });

    // Check if hour is within any global block - using local time
    const isBlockedByGlobal = globalBlocks.some(slot => {
      const start = slot.start;
      const end = slot.end;
      
      if (start <= end) {
        return hour >= start && hour < end;
      } else {
        // Handle overnight blocks (e.g., 18-9)
        return hour >= start || hour < end;
      }
    });

    // If no blocks are defined, use default blocked hours
    if (tzSpecificBlocks.length === 0 && globalBlocks.length === 0) {
      const start = defaultBlockedHours.start;
      const end = defaultBlockedHours.end;
      
      if (start <= end) {
        return !(hour >= start && hour < end);
      } else {
        // Handle overnight blocks (e.g., 18-9)
        return !(hour >= start || hour < end);
      }
    }
    
    // Hour is blocked if it's in any of the blocked slots
    return !(isBlockedBySpecific || isBlockedByGlobal);
  }, [blockedTimeSlots, defaultBlockedHours, ianaName]);

  // Track when user stops dragging the timeline
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    
    // Only track if position has changed significantly (more than 5%)
    if (lastTrackedPosition === null || Math.abs(position - lastTrackedPosition) > 5) {
      const hour = Math.floor((position / 100) * 24);
      const minute = Math.floor(((position / 100) * 24 % 1) * 60);
      
      trackEvent(posthog, EventCategory.UI, EventAction.CHANGE, {
        action: 'timeline_time_change',
        timezone: ianaName,
        from_position: lastTrackedPosition,
        to_position: position,
        hour: hour,
        minute: minute,
        is_active_hour: isHourActive(hour)
      });
      
      setLastTrackedPosition(position);
    }
  }, [position, lastTrackedPosition, ianaName, isHourActive, posthog]);

  // Get the visual segments for the timeline
  const getTimelineSegments = useCallback(() => {
    const segments: { start: number; end: number; isActive: boolean }[] = [];
    let currentIsActive = isHourActive(0);
    let segmentStart = 0;

    // Iterate through all 24 hours to find segments
    for (let hour = 1; hour <= 24; hour++) {
      const isActive = hour === 24 ? isHourActive(0) : isHourActive(hour);
      
      // If activity status changes, create a new segment
      if (isActive !== currentIsActive || hour === 24) {
        segments.push({
          start: segmentStart,
          end: hour,
          isActive: currentIsActive
        });
        segmentStart = hour;
        currentIsActive = isActive;
      }
    }

    return segments;
  }, [isHourActive]);

  return (
    <div className="mt-4 relative select-none">
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-10 cursor-pointer"
        value={[position]}
        max={100}
        step={isMobile ? 100/(24*4) : 100/(24*12)} // 15-minute steps on mobile, 5-minute steps on desktop
        onValueChange={handleValueChange}
        onPointerDown={handleDragStart}
        onPointerUp={handleDragEnd}
      >
        <Slider.Track className="relative h-2 grow rounded-full bg-gradient-to-r from-blue-900 via-blue-200 to-blue-900 border border-blue-300">
          {/* Blocked time indicators */}
          <div className="absolute inset-0">
            {getTimelineSegments().map((segment, index) => {
              if (!segment.isActive) {
                const startPercent = (segment.start / 24) * 100;
                const widthPercent = ((segment.end - segment.start) / 24) * 100;
                
                return (
                  <div
                    key={index}
                    className="absolute h-full bg-white/90"
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  >
                    <div className="w-full h-full bg-stripes-gray/10" />
                  </div>
                );
              }
              return null;
            })}
          </div>
          
          {/* Hour markers */}
          <div className="absolute inset-0 flex items-center">
            {(isMobile ? MARKERS.mobile : MARKERS.desktop).map((hour) => (
              <div
                key={hour}
                className={cn(
                  "absolute h-3 w-px",
                  isHourActive(hour) ? "bg-blue-200" : "bg-gray-200"
                )}
                style={{
                  left: `${(hour / 24) * 100}%`,
                  top: '-4px'
                }}
              />
            ))}
          </div>
        </Slider.Track>

        <Slider.Thumb
          className={cn(
            "block w-10 md:w-16 h-6 -top-2 bg-white rounded-lg border shadow-md",
            "transition-all duration-200 focus:outline-none focus:ring focus:ring-blue-500",
            "hover:shadow-lg group",
            isDragging ? 'scale-105 shadow-lg border-blue-400' : 'border-slate-200 hover:border-slate-300',
            !isHourActive(Math.floor((position / 100) * 24)) && 'border-gray-200'
          )}
        >
          <div className="flex gap-1 h-full items-center justify-center">
            <div className={cn(
              "w-0.5 h-3 rounded-full",
              isHourActive(Math.floor((position / 100) * 24)) 
                ? "bg-blue-300 group-hover:bg-blue-400" 
                : "bg-gray-200 group-hover:bg-gray-300"
            )} />
            <div className={cn(
              "w-0.5 h-3 rounded-full",
              isHourActive(Math.floor((position / 100) * 24)) 
                ? "bg-blue-300 group-hover:bg-blue-400" 
                : "bg-gray-200 group-hover:bg-gray-300"
            )} />
            <div className={cn(
              "w-0.5 h-3 rounded-full",
              isHourActive(Math.floor((position / 100) * 24)) 
                ? "bg-blue-300 group-hover:bg-blue-400" 
                : "bg-gray-200 group-hover:bg-gray-300"
            )} />
          </div>
        </Slider.Thumb>
      </Slider.Root>

      {/* Time labels */}
      <div className="relative mt-4 text-sm text-gray-500">
        {(isMobile ? LABELS.mobile : LABELS.desktop).map(hour => (
          <div
            key={hour}
            className={cn(
              "absolute transform -translate-x-1/2",
              !isHourActive(hour) && "text-gray-300"
            )}
            style={{ left: `${(hour / 24) * 100}%` }}
          >
            {use24Hour 
              ? `${(hour % 24).toString().padStart(2, '0')}:00`
              : hour === 0 || hour === 24 ? '12am' : hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}am`
            }
          </div>
        ))}
      </div>
    </div>
  )
} 