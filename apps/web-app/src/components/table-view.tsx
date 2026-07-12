'use client';

import React from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';

interface TableViewProps {
  timezones: string[];
  date: Date;
  blockedHours?: {
    [timezone: string]: number[];
  };
}

export function TableView({ timezones, date, blockedHours = {} }: TableViewProps) {
  // Generate 24 hours starting from UTC midnight
  const hours = Array.from({ length: 24 }, (_, i) => {
    const baseDate = setMinutes(setHours(date, i), 0);
    return baseDate;
  });

  // Function to determine cell background color based on time
  function getCellColor(hour: number): string {
    if (hour >= 23 || hour < 6) return 'bg-red-100'; // Night (11 PM - 6 AM)
    if (hour >= 6 && hour < 9) return 'bg-yellow-50'; // Early morning (6 AM - 9 AM)
    if (hour >= 9 && hour < 17) return 'bg-green-50'; // Work hours (9 AM - 5 PM)
    return 'bg-yellow-100'; // Evening (5 PM - 11 PM)
  }

  // Function to check if an hour is blocked for a timezone
  function isBlocked(timezone: string, hour: number): boolean {
    return blockedHours[timezone]?.includes(hour) || false;
  }

  // Function to get hour from timezone and UTC time
  function getHourInTimezone(utcTime: Date, timezone: string): number {
    return parseInt(formatInTimeZone(utcTime, timezone, 'H'));
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2 bg-gray-50 border text-left">UTC time</th>
            {timezones.map((timezone) => (
              <th key={timezone} className="px-4 py-2 bg-gray-50 border text-left">
                {timezone}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((utcHour) => (
            <tr key={utcHour.toISOString()}>
              <td className="px-4 py-2 border text-sm font-mono">
                {format(utcHour, 'EEEE, d MMM yyyy, HH:mm')}
              </td>
              {timezones.map((timezone) => {
                const hour = getHourInTimezone(utcHour, timezone);
                const isBlockedHour = isBlocked(timezone, hour);
                const timeInZone = formatInTimeZone(utcHour, timezone, 'HH:mm');

                return (
                  <td
                    key={timezone}
                    className={cn(
                      'px-4 py-2 border text-sm',
                      getCellColor(hour),
                      isBlockedHour && 'bg-gray-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{timeInZone}</span>
                      {isBlockedHour && (
                        <span className="text-xs text-gray-500 ml-2">Blocked</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 