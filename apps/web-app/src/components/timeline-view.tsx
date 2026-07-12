'use client';

import { TimeZoneInfo } from '@/lib/timezone';
import { TimelineSettings } from '@/lib/types';
import { TimezoneCard } from '@/components/timezone-card';
import { RadioIcon } from "@heroicons/react/24/outline";

interface TimelineViewProps {
  timeZones: TimeZoneInfo[];
  selectedDate: Date;
  onTimeChange: (date: Date) => void;
  onRemoveTimeZone: (ianaName: string) => void;
  timelineSettings: TimelineSettings;
  isEditMode: boolean;
}

export function TimelineView({
  timeZones,
  selectedDate,
  onTimeChange,
  onRemoveTimeZone,
  timelineSettings,
  isEditMode
}: TimelineViewProps) {
  return (
    <div className="space-y-6">
      {timeZones.length === 0 ? (
        <div className="text-center py-12">
          <RadioIcon className="h-16 w-16 mx-auto mb-4 text-slate-500" />
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome to ZonePal</h2>
          <p className="text-gray-500">Start by adding a timezone from the search box</p>
        </div>
      ) : (
        timeZones.map((timezone) => (
          <TimezoneCard
            key={timezone.ianaName}
            timezone={timezone}
            selectedDate={selectedDate}
            onTimeChange={onTimeChange}
            onRemove={onRemoveTimeZone}
            timelineSettings={timelineSettings}
            isEditMode={isEditMode}
          />
        ))
      )}
    </div>
  );
} 