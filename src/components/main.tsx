'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useAuth } from '@/contexts/auth-context';
import { useUserData } from '@/contexts/user-data-context';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Squares2X2Icon, ListBulletIcon, CalendarIcon, ArrowsUpDownIcon, PencilIcon } from '@heroicons/react/24/outline';
import { TimelineView } from '@/components/timeline-view';
import { TableView } from '@/components/table-view';
import { EventCategory, EventAction, trackEvent } from '@/lib/analytics';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimezoneSearch } from '@/components/timezone-search';
import { cn } from '@/lib/utils';
import { SettingsDialog } from '@/components/settings-dialog';
import { TimeZoneInfo, findTimezoneByIana, getTimeInTimeZone } from '@/lib/timezone';
import { TimelineSettings } from '@/lib/types';
import { EmptyState } from '@/components/empty-state';
import { AppFooter } from '@/components/app-footer';
import { UserMenu } from '@/components/auth/user-menu';

interface BlockedHours {
  [timezone: string]: number[];
}

type ViewType = 'cards' | 'grid';

export function Main() {
  const posthog = usePostHog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { userData, updateSettings, updateView, updateRecent } = useUserData();
  
  // Initialize view from user data or default to cards
  const [view, setView] = useState<ViewType>(() => {
    return userData?.defaultView || 'cards';
  });
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  
  // Initialize timezones from URL
  const [timeZones, setTimeZones] = useState<TimeZoneInfo[]>(() => {
    const ianaNames = searchParams.get('z')?.split(',') || [];
    return ianaNames
      .map(name => findTimezoneByIana(name))
      .filter((tz): tz is TimeZoneInfo => tz !== undefined)
      .map(tz => ({
        ...tz,
        ...getTimeInTimeZone(new Date(), tz.ianaName)
      }));
  });

  // Initialize timeline settings from user data or URL
  const [timelineSettings, setTimelineSettings] = useState<TimelineSettings>(() => {
    // First check if user is logged in and has settings
    if (user && userData?.timelineSettings) {
      return userData.timelineSettings;
    }
    
    // Fall back to URL parameters
    const blockedParam = searchParams.get('b');
    const blockedTimeSlots = blockedParam 
      ? blockedParam.split(',').map(block => {
          const [start, end] = block.split('-').map(Number);
          return { start, end };
        })
      : [{ start: 22, end: 6 }];
    
    return {
      blockedTimeSlots,
      defaultBlockedHours: blockedTimeSlots[0],
      referenceTimezone: 'UTC'
    };
  });

  // Update times every minute and when selectedDate changes
  useEffect(() => {
    const updateTimes = () => {
      setTimeZones(prevZones => 
        prevZones.map(tz => ({
          ...tz,
          ...getTimeInTimeZone(selectedDate, tz.ianaName)
        }))
      );
    };

    // Initial update
    updateTimes();

    // Set up interval for updates
    const interval = setInterval(updateTimes, 60000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  // Sync user data when userData changes
  useEffect(() => {
    if (userData) {
      // Update view if different from user preference
      if (userData.defaultView !== view) {
        setView(userData.defaultView);
      }
      
      // Update timeline settings if different from user data
      if (JSON.stringify(userData.timelineSettings) !== JSON.stringify(timelineSettings)) {
        setTimelineSettings(userData.timelineSettings);
      }
      
      // Load recent timezones if no timezones are currently active and no URL params
      const hasUrlTimezones = searchParams.get('z');
      if (!hasUrlTimezones && timeZones.length === 0 && userData.recentTimezones.length > 0) {
        // Load the most recent timezones (up to 3)
        const recentToLoad = userData.recentTimezones.slice(0, 3);
        const loadedTimezones = recentToLoad
          .map(name => findTimezoneByIana(name))
          .filter((tz): tz is TimeZoneInfo => tz !== undefined)
          .map(tz => ({
            ...tz,
            ...getTimeInTimeZone(selectedDate, tz.ianaName)
          }));
        
        if (loadedTimezones.length > 0) {
          setTimeZones(loadedTimezones);
        }
      }
    }
  }, [userData, view, timelineSettings, timeZones.length, searchParams, selectedDate]);

  // Update URL when timezones or blocked hours change
  useEffect(() => {
    const zParam = timeZones.map(tz => tz.ianaName).join(',');
    const bParam = timelineSettings.blockedTimeSlots
      .map(slot => `${slot.start}-${slot.end}`)
      .join(',');
    
    const url = zParam 
      ? `/?z=${zParam}&b=${bParam}`
      : `/?b=${bParam}`;
    
    router.push(url);
  }, [timeZones, timelineSettings.blockedTimeSlots, router]);

  // Get blocked hours for grid view
  const blockedHours = useMemo(() => {
    const blocks: BlockedHours = {};
    
    timeZones.forEach(tz => {
      blocks[tz.ianaName] = [];
      timelineSettings.blockedTimeSlots.forEach(slot => {
        if (slot.start > slot.end) {
          // Handle overnight blocks
          for (let h = slot.start; h < 24; h++) blocks[tz.ianaName].push(h);
          for (let h = 0; h <= slot.end; h++) blocks[tz.ianaName].push(h);
        } else {
          for (let h = slot.start; h <= slot.end; h++) blocks[tz.ianaName].push(h);
        }
      });
    });

    return blocks;
  }, [timeZones, timelineSettings.blockedTimeSlots]);

  // Track view changes
  const handleViewChange = async (newView: ViewType) => {
    setView(newView);
    
    // Save view preference to Firebase if user is logged in
    if (user) {
      try {
        await updateView(newView);
      } catch (error) {
        console.error('Failed to save view preference:', error);
      }
    }
    
    trackEvent(posthog, EventCategory.UI, EventAction.CHANGE, {
      view: newView,
      source: 'view_toggle'
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Update all timezone times when date changes
      setTimeZones(prevZones => 
        prevZones.map(tz => ({
          ...tz,
          ...getTimeInTimeZone(date, tz.ianaName)
        }))
      );
      setIsCalendarOpen(false);
    }
  };

  const handleTimeChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // Update all timezone times when time changes
    setTimeZones(prevZones => 
      prevZones.map(tz => ({
        ...tz,
        ...getTimeInTimeZone(newDate, tz.ianaName)
      }))
    );
  };

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(!isEditMode);
    trackEvent(posthog, EventCategory.UI, EventAction.TOGGLE, {
      action: isEditMode ? 'edit_mode_off' : 'edit_mode_on'
    });
  }, [isEditMode, posthog]);

  const handleSort = useCallback(() => {
    setTimeZones(prev => {
      // First sort by UTC offset
      const sortedZones = [...prev].sort((a, b) => a.utcOffset - b.utcOffset);
      
      // Then update times for all sorted zones
      const updatedSortedZones = sortedZones.map(tz => ({
        ...tz,
        ...getTimeInTimeZone(selectedDate, tz.ianaName)
      }));
      
      // Track timezone sorting
      trackEvent(posthog, EventCategory.TIMEZONE, EventAction.SORT, {
        count: updatedSortedZones.length,
        view
      });
      
      return updatedSortedZones;
    });
  }, [selectedDate, view, posthog]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      // Handle keyboard shortcuts
      if (e.key.toLowerCase() === 'e' && view === 'cards') {
        handleToggleEditMode();
      } else if (e.key.toLowerCase() === 's') {
        handleSort();
      } else if (e.key.toLowerCase() === 'r') {
        handleDateSelect(new Date());
      } else if (e.key.toLowerCase() === 'k') {
        // Prevent default to avoid typing 'k' in the search box
        e.preventDefault();
        // Focus on the search input
        if (searchTriggerRef.current) {
          searchTriggerRef.current.click();
        }
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [view, handleToggleEditMode, handleSort]);

  const handleAddTimeZone = (timezone: TimeZoneInfo) => {
    setTimeZones(prev => {
      if (prev.some(tz => tz.ianaName === timezone.ianaName)) return prev;
      const updatedZone = {
        ...timezone,
        ...getTimeInTimeZone(selectedDate, timezone.ianaName)
      };
      const updatedZones = [...prev, updatedZone];
      
      // Update recent timezones in Firebase if user is logged in
      if (user) {
        const recentTimezones = [timezone.ianaName, ...updatedZones.slice(0, -1).map(tz => tz.ianaName)];
        updateRecent(recentTimezones.slice(0, 10)).catch(error => {
          console.error('Failed to update recent timezones:', error);
        });
      }
      
      // Track timezone added
      trackEvent(posthog, EventCategory.TIMEZONE, EventAction.ADD, {
        timezone: timezone.ianaName,
        total_count: updatedZones.length,
        view
      });
      
      return updatedZones;
    });
  };

  const handleRemoveTimeZone = (ianaName: string) => {
    setTimeZones(prev => {
      const updatedZones = prev.filter(tz => tz.ianaName !== ianaName);
      
      // Track timezone removed
      trackEvent(posthog, EventCategory.TIMEZONE, EventAction.REMOVE, {
        timezone: ianaName,
        total_count: updatedZones.length,
        view
      });
      
      return updatedZones;
    });
  };

  const handleSettingsChange = async (settings: TimelineSettings) => {
    setTimelineSettings(settings);
    
    // Save settings to Firebase if user is logged in
    if (user) {
      try {
        await updateSettings(settings);
      } catch (error) {
        console.error('Failed to save timeline settings:', error);
      }
    }
    
    // Track settings change
    trackEvent(posthog, EventCategory.BLOCKED_HOURS, EventAction.UPDATE, {
      count: settings.blockedTimeSlots.length,
      blocks: settings.blockedTimeSlots.map(slot => `${slot.start}-${slot.end}`),
      view
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-7xl flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">ZonePal</h1>
            <p className="text-sm text-gray-500 mt-1">Time zone converter for remote teams</p>
          </div>
          <div className="flex items-center gap-3">
            <UserMenu />
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={view === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('cards')}
              className={cn(
                "transition-all",
                view === 'cards' ? 'shadow-sm' : 'hover:bg-transparent'
              )}
            >
              <ListBulletIcon className="h-4 w-4 mr-1" />
              Cards
            </Button>
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('grid')}
              className={cn(
                "transition-all",
                view === 'grid' ? 'shadow-sm' : 'hover:bg-transparent'
              )}
            >
              <Squares2X2Icon className="h-4 w-4 mr-1" />
              Grid
            </Button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <TimezoneSearch 
                onSelect={handleAddTimeZone}
                selectedTimezones={timeZones.map(tz => tz.ianaName)}
                triggerRef={searchTriggerRef}
                userRecentTimezones={userData?.recentTimezones}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative z-40">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "transition-colors shrink-0",
                      "md:w-40",
                      "w-10 px-0 md:px-4",
                      selectedDate.toDateString() !== new Date().toDateString() && "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">{format(selectedDate, 'MMM dd, yyyy')}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0" 
                  align="end" 
                  sideOffset={4}
                  onOpenAutoFocus={(e) => {
                    if (window.innerWidth < 640) {
                      e.preventDefault();
                    }
                  }}
                  forceMount
                  style={{
                    maxWidth: 'calc(100vw - 32px)',
                    maxHeight: 'calc(100vh - 32px)',
                  }}
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="rounded-md border max-w-full overflow-auto"
                  />
                </PopoverContent>
              </Popover>
              </div>
              <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSort}
                title="Sort by timezone offset (S)"
                className="shrink-0"
              >
                <ArrowsUpDownIcon className="h-5 w-5" />
                <span className="sr-only">Sort timezones</span>
              </Button>
              <SettingsDialog 
                settings={timelineSettings}
                onSettingsChange={handleSettingsChange}
                timeZones={timeZones.map(tz => ({ name: tz.name, ianaName: tz.ianaName }))}
              />
              {view === 'cards' && (
                <Button 
                  variant={isEditMode ? "default" : "ghost"}
                  size="icon"
                  onClick={handleToggleEditMode}
                  title={isEditMode ? "Exit edit mode (E)" : "Edit time values (E)"}
                  className="shrink-0"
                  aria-pressed={isEditMode}
                >
                  <PencilIcon className="h-5 w-5" />
                  <span className="sr-only">{isEditMode ? "Exit edit mode" : "Edit time values"}</span>
                </Button>
              )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {timeZones.length === 0 ? (
            <EmptyState onAddTimezone={() => searchTriggerRef.current?.click()} />
          ) : view === 'cards' ? (
          <TimelineView 
            timeZones={timeZones}
            selectedDate={selectedDate}
            onTimeChange={handleTimeChange}
            onRemoveTimeZone={handleRemoveTimeZone}
            timelineSettings={timelineSettings}
            isEditMode={isEditMode}
          />
        ) : (
          <TableView
            timezones={timeZones.map(tz => tz.ianaName)}
            date={selectedDate}
            blockedHours={blockedHours}
          />
          )}
        </div>
        
        <AppFooter />
      </div>
    </main>
  );
} 