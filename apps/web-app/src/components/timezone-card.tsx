'use client';

import { useState, useRef, useEffect } from 'react';
import { TimeZoneInfo } from '@/lib/timezone';
import { TimelineRadix } from '@/components/timeline-radix';
import { WeatherIcon } from '@/components/weather-icon';
import { XMarkIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { TimelineSettings } from '@/lib/types';
import { usePostHog } from 'posthog-js/react';
import { trackEvent, EventCategory, EventAction } from '@/lib/analytics';
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { parse, addMinutes, addHours } from 'date-fns';

interface TimezoneCardProps {
  timezone: TimeZoneInfo;
  selectedDate: Date;
  onTimeChange: (newDate: Date) => void;
  onRemove: (ianaName: string) => void;
  timelineSettings: TimelineSettings;
  isEditMode?: boolean;
}

export function TimezoneCard({
  timezone,
  selectedDate,
  onTimeChange,
  onRemove,
  timelineSettings,
  isEditMode = false
}: TimezoneCardProps) {
  const posthog = usePostHog();
  const [timeInput, setTimeInput] = useState(timezone.time);
  const [isValidInput, setIsValidInput] = useState(true);
  const timeInputRef = useRef<HTMLInputElement>(null);
  
  // Update the time input when the timezone time changes or edit mode changes
  useEffect(() => {
    setTimeInput(timezone.time);
    setIsValidInput(true);
  }, [timezone.time, isEditMode]);
  
  // Focus the input field when entering edit mode
  useEffect(() => {
    if (isEditMode && timeInputRef.current) {
      timeInputRef.current.focus();
      timeInputRef.current.select();
    }
  }, [isEditMode]);
  
  const handleRemove = () => {
    // Track timezone removal in the card component
    trackEvent(posthog, EventCategory.TIMEZONE, EventAction.REMOVE, {
      timezone: timezone.ianaName,
      source: 'card_remove_button'
    });
    
    onRemove(timezone.ianaName);
  };
  
  // Validate time input format
  const isValidTimeFormat = (input: string): boolean => {
    // Valid formats: "3:45 PM", "03:45 PM", "15:45"
    const twelveHourFormat = /^(0?[1-9]|1[0-2]):[0-5][0-9] [AP]M$/i;
    const twentyFourHourFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    return twelveHourFormat.test(input) || twentyFourHourFormat.test(input);
  };
  
  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow typing but restrict to reasonable length
    if (newValue.length <= 8) {
      setTimeInput(newValue);
      
      // Check if the input is valid
      const isValid = isValidTimeFormat(newValue);
      setIsValidInput(isValid);
      
      // Only update time if input is valid
      if (isValid) {
        const newTime = parseTimeInput(newValue);
        if (newTime) {
          // Track time edit
          trackEvent(posthog, EventCategory.UI, EventAction.CHANGE, {
            action: 'time_edit',
            timezone: timezone.ianaName,
            old_time: timezone.time,
            new_time: newValue
          });
          
          // Update the time
          onTimeChange(newTime);
        }
      }
    }
  };
  
  // Increment time by the specified amount
  const incrementTime = (amount: number, unit: 'hours' | 'minutes') => {
    try {
      // Parse current time
      const currentTime = parseTimeInput(timeInput);
      if (!currentTime) return;
      
      let newTime;
      
      if (unit === 'hours') {
        // For hours, simply add the amount
        newTime = addHours(currentTime, amount);
      } else {
        // For minutes, first round to nearest multiple of 5, then add
        const minutes = currentTime.getMinutes();
        const roundedMinutes = Math.round(minutes / 5) * 5;
        
        // Create a new date with rounded minutes
        const roundedTime = new Date(currentTime);
        roundedTime.setMinutes(roundedMinutes);
        
        // Then add the increment
        newTime = addMinutes(roundedTime, amount);
      }
      
      // Format the new time in the same format as the current time
      const is12Hour = /AM|PM/i.test(timeInput);
      const formattedTime = formatTz(
        toZonedTime(newTime, timezone.ianaName),
        is12Hour ? 'h:mm a' : 'HH:mm',
        { timeZone: timezone.ianaName }
      );
      
      // Update the time input
      setTimeInput(formattedTime);
      setIsValidInput(true);
      
      // Track time change
      trackEvent(posthog, EventCategory.UI, EventAction.CHANGE, {
        action: 'time_increment',
        timezone: timezone.ianaName,
        old_time: timeInput,
        new_time: formattedTime,
        increment: `${amount} ${unit}`
      });
      
      // Update the global time
      onTimeChange(newTime);
    } catch (error) {
      console.error('Error incrementing time:', error);
    }
  };
  
  const handleIncrementHour = () => incrementTime(1, 'hours');
  const handleDecrementHour = () => incrementTime(-1, 'hours');
  const handleIncrementMinute = () => incrementTime(5, 'minutes');
  const handleDecrementMinute = () => incrementTime(-5, 'minutes');
  
  const parseTimeInput = (input: string): Date | null => {
    try {
      // Try to parse the input time (e.g., "3:45 PM" or "15:45")
      const timeFormat = /^\d{1,2}:\d{2} [AP]M$/i.test(input) ? 'h:mm a' : 'H:mm';
      const parsedTime = parse(input, timeFormat, new Date());
      
      if (isNaN(parsedTime.getTime())) {
        return null;
      }
      
      // Get the current date in the target timezone
      const zonedDate = toZonedTime(selectedDate, timezone.ianaName);
      
      // Create a new date with the parsed hours and minutes
      const newDate = new Date(selectedDate);
      
      // Get timezone offset
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone.ianaName,
        timeZoneName: 'shortOffset'
      });
      const parts = formatter.formatToParts(zonedDate);
      const offsetStr = parts.find(part => part.type === 'timeZoneName')?.value || '';
      const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::?(\d{2})?)?/);
      
      let offsetHours = 0;
      let offsetMinutes = 0;
      if (match) {
        const [, sign, hours, minutes = '00'] = match;
        offsetHours = parseInt(hours) * (sign === '+' ? 1 : -1);
        offsetMinutes = parseInt(minutes) * (sign === '+' ? 1 : -1);
      }
      
      // Set the hours and minutes, adjusted for timezone
      newDate.setUTCHours(
        parsedTime.getHours() - offsetHours,
        parsedTime.getMinutes() - offsetMinutes,
        0,
        0
      );
      
      return newDate;
    } catch (error) {
      console.error('Error parsing time input:', error);
      return null;
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      // Reset to current time on escape
      setTimeInput(timezone.time);
      setIsValidInput(true);
      // Remove focus from input
      timeInputRef.current?.blur();
    } else if (e.key === 'Enter') {
      // If input is invalid, reset to current time
      if (!isValidInput) {
        setTimeInput(timezone.time);
        setIsValidInput(true);
      }
      // Remove focus from input
      timeInputRef.current?.blur();
    } else if (e.key.toLowerCase() === 'e') {
      // Let the parent component handle this
      // We don't call e.preventDefault() here to allow the event to bubble up
      // The parent component will handle toggling edit mode
      return;
    } else if (e.key === 'ArrowUp') {
      // Increment time with arrow keys
      e.preventDefault();
      if (e.shiftKey) {
        handleIncrementHour();
      } else {
        handleIncrementMinute();
      }
    } else if (e.key === 'ArrowDown') {
      // Decrement time with arrow keys
      e.preventDefault();
      if (e.shiftKey) {
        handleDecrementHour();
      } else {
        handleDecrementMinute();
      }
    }
  };
  
  const handleBlur = () => {
    // If input is invalid when focus is lost, reset to current time
    if (!isValidInput) {
      setTimeInput(timezone.time);
      setIsValidInput(true);
    }
  };

  return (
    <div className="bg-white rounded-lg p-8 pr-12 shadow-sm relative group">
      {/* Remove timezone button */}
      <button
        onClick={handleRemove}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Remove ${timezone.name} timezone`}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
      
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-3xl font-semibold">{timezone.name}</h2>
            <WeatherIcon 
              city={timezone.label}
              country={timezone.country}
              className="mt-1"
            />
          </div>
          <div className="flex flex-col text-sm">
            <span className="text-gray-400 text-xs">
              {timezone.ianaName}
              {timezone.dstOffset !== timezone.utcOffset && " (observes DST)"}
            </span>
          </div>
        </div>
        <div className="text-right">
          {isEditMode ? (
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                {/* Time input field */}
                <input
                  ref={timeInputRef}
                  type="text"
                  value={timeInput}
                  onChange={handleTimeInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  className={`text-lg md:text-3xl font-bold w-24 md:w-40 text-right bg-[#f7f7f7] border ${isValidInput ? 'border-gray-300' : 'border-red-500'} rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  aria-label={`Edit time for ${timezone.name}`}
                  aria-live="polite"
                  role="textbox"
                  aria-multiline="false"
                  placeholder={timezone.time}
                  aria-invalid={!isValidInput}
                />
                
                {/* Time controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={handleIncrementMinute}
                    className="text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none"
                    aria-label="Increment minutes by 5"
                    title="Increment minutes by 5"
                  >
                    <ChevronUpIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleDecrementMinute}
                    className="text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none"
                    aria-label="Decrement minutes by 5"
                    title="Decrement minutes by 5"
                  >
                    <ChevronDownIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-lg md:text-3xl font-bold">{timezone.time}</div>
          )}
          <div className="text-gray-400 text-sm">{timezone.date}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4">
        <TimelineRadix
          ianaName={timezone.ianaName}
          selectedDate={selectedDate}
          onTimeChange={onTimeChange}
          blockedTimeSlots={timelineSettings.blockedTimeSlots}
          defaultBlockedHours={timelineSettings.defaultBlockedHours}
          referenceTimezone={timelineSettings.referenceTimezone}
        />
      </div>
    </div>
  );
} 