import * as React from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { PlusIcon, CheckIcon } from "@heroicons/react/24/outline"
import { TimeZoneInfo, timezoneDatabase } from "@/lib/timezone"
import { getRecentTimezones } from "@/lib/utils"

// Debug mode flag - set to true to show debug panel
const DEBUG_MODE = false;

interface TimezoneSearchProps {
  onSelect: (timezone: TimeZoneInfo) => void;
  selectedTimezones?: string[]; // Array of selected IANA timezone names
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

interface GroupedTimezones {
  [key: string]: TimeZoneInfo[];
}

// Memoized timezone item component
const TimezoneItem = React.memo(({ 
  timezone, 
  onSelect,
  isSelected
}: { 
  timezone: TimeZoneInfo; 
  onSelect: (value: string) => void;
  isSelected: boolean;
}) => (
  <CommandItem
    value={`${timezone.label} ${timezone.country}`}
    onSelect={() => onSelect(timezone.ianaName)}
    disabled={isSelected}
    className={isSelected ? 'opacity-50 cursor-not-allowed' : ''}
  >
    <span className="flex items-center justify-between w-full">
      <span className="flex items-center gap-2">
        {isSelected && (
          <CheckIcon className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex flex-col">
          <span>{timezone.label}</span>
          <span className="text-xs text-muted-foreground">
            {timezone.country} {timezone.countryCode ? `(${timezone.countryCode})` : ''}
          </span>
        </span>
      </span>
      <span className="text-xs text-muted-foreground ml-2">
        {timezone.timezone}
      </span>
    </span>
  </CommandItem>
));

TimezoneItem.displayName = 'TimezoneItem';

// Memoized timezone group component
const TimezoneGroup = React.memo(({ 
  region, 
  timezones,
  onSelect,
  selectedTimezones
}: { 
  region: string; 
  timezones: TimeZoneInfo[];
  onSelect: (value: string) => void;
  selectedTimezones: string[];
}) => (
  <CommandGroup heading={region}>
    {timezones.map((timezone) => (
      <TimezoneItem
        key={timezone.ianaName}
        timezone={timezone}
        onSelect={onSelect}
        isSelected={selectedTimezones.includes(timezone.ianaName)}
      />
    ))}
  </CommandGroup>
));

TimezoneGroup.displayName = 'TimezoneGroup';

export function TimezoneSearch({ onSelect, selectedTimezones = [], triggerRef }: TimezoneSearchProps) {
  const [search, setSearch] = React.useState("");
  const [lastSelected, setLastSelected] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [recentTimezones, setRecentTimezones] = React.useState<TimeZoneInfo[]>([]);

  const availableTimezones = React.useMemo(() => 
    timezoneDatabase
  , []);

  // Load recent timezones
  React.useEffect(() => {
    if (open) {
      const recentIanaNames = getRecentTimezones();
      
      // Filter out already selected timezones
      const filteredRecentNames = recentIanaNames.filter(
        name => !selectedTimezones.includes(name)
      );
      
      // Convert IANA names to timezone objects
      const timezones = filteredRecentNames
        .map(name => timezoneDatabase.find(tz => tz.ianaName === name))
        .filter((tz): tz is TimeZoneInfo => tz !== undefined);
      
      setRecentTimezones(timezones);
    }
  }, [open, selectedTimezones]);

  // Filter timezones based on search
  const filteredTimezones = React.useMemo(() => {
    if (!search) {
      return availableTimezones;
    }
    
    // Clean up search input but keep spaces for matching
    const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) {
      return availableTimezones;
    }

    // First try to find exact matches
    const exactMatches = availableTimezones.filter(tz => {
      const cityName = tz.label.toLowerCase();
      return cityName === searchTerms.join(' ');
    });

    if (exactMatches.length > 0) {
      // Log first 5 exact matches
      if (DEBUG_MODE) {
        console.log('Exact matches for:', search);
        console.log(exactMatches.slice(0, 5).map(tz => `${tz.label}, ${tz.country} (${tz.ianaName})`));
      }
      return exactMatches;
    }

    // Then try to find partial matches where all terms are included
    const partialMatches = availableTimezones.filter(tz => {
      const searchableText = [
        tz.label.toLowerCase(),
        tz.country.toLowerCase(),
        tz.countryCode.toLowerCase(),
      ].join(' ');

      return searchTerms.every(term => searchableText.includes(term));
    });

    if (partialMatches.length > 0) {
      // Log first 5 partial matches
      if (DEBUG_MODE) {
        console.log('Partial matches for:', search);
        console.log(partialMatches.slice(0, 5).map(tz => `${tz.label}, ${tz.country} (${tz.ianaName})`));
      }
      return partialMatches;
    }

    // Finally, try broader matches where any term matches
    const broadMatches = availableTimezones.filter(tz => {
      const searchableText = [
        tz.label.toLowerCase(),
        tz.region.toLowerCase(),
        tz.country.toLowerCase(),
        tz.countryCode.toLowerCase(),
        tz.timezone.toLowerCase(),
        tz.ianaName.toLowerCase()
      ].join(' ');

      return searchTerms.some(term => searchableText.includes(term));
    });
    
    // Log first 5 broad matches
    if (DEBUG_MODE) {
      console.log('Broad matches for:', search);
      console.log(broadMatches.slice(0, 5).map(tz => `${tz.label}, ${tz.country} (${tz.ianaName})`));
    }
    
    return broadMatches;
  }, [availableTimezones, search]);

  // Get recent timezones for debug panel
  const recentTimezoneNames = React.useMemo(() => {
    return getRecentTimezones();
  }, []); // Remove the unnecessary 'open' dependency

  // Get filtered recent timezones for debug panel
  const filteredRecentTimezoneNames = React.useMemo(() => {
    return recentTimezoneNames.filter(name => !selectedTimezones.includes(name));
  }, [recentTimezoneNames, selectedTimezones]);

  // Group timezones by region and sort by country
  const groupedTimezones = React.useMemo(() => {
    const groups: GroupedTimezones = {};
    
    // First group by region
    filteredTimezones.forEach(tz => {
      // For country searches, group by country instead of region
      const isCountrySearch = filteredTimezones.every(t => t.country === filteredTimezones[0].country);
      const groupKey = isCountrySearch ? tz.country : tz.region;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tz);
    });
    
    // Sort timezones within each group
    Object.keys(groups).forEach(groupKey => {
      groups[groupKey].sort((a, b) => {
        // If it's a country search, sort by city name only
        if (a.country === b.country) {
          return a.label.localeCompare(b.label);
        }
        // Otherwise, sort by country then city
        const countryCompare = a.country.localeCompare(b.country);
        return countryCompare !== 0 ? countryCompare : a.label.localeCompare(b.label);
      });
    });
    
    return groups;
  }, [filteredTimezones]);

  // Memoize the handleSelect function
  const handleSelect = React.useCallback((value: string) => {
    if (!value || value === lastSelected) return;
    
    try {
      const selectedTimezone = timezoneDatabase.find(tz => tz.ianaName === value);
      if (!selectedTimezone) return;

      // Update state in a more controlled way
      setLastSelected(value);
      setSearch(""); // Reset search first
      setOpen(false); // Close popover after selection
      // Use requestAnimationFrame to ensure state updates are processed before callback
      requestAnimationFrame(() => {
        onSelect(selectedTimezone);
      });
    } catch (error) {
      // Silent error handling
    }
  }, [onSelect, lastSelected]);

  // Memoize the timezone groups rendering
  const timezoneGroups = React.useMemo(() => (
    Object.entries(groupedTimezones || {}).map(([region, timezones]) => (
      <TimezoneGroup
        key={region}
        region={region}
        timezones={timezones}
        onSelect={handleSelect}
        selectedTimezones={selectedTimezones}
      />
    ))
  ), [groupedTimezones, handleSelect, selectedTimezones]);

  // Memoize the recent timezones rendering
  const recentTimezoneItems = React.useMemo(() => {
    if (recentTimezones.length === 0) return null;
    
    return (
      <>
        <CommandGroup heading="Recent">
          {recentTimezones.map((timezone) => (
            <TimezoneItem
              key={`recent-${timezone.ianaName}`}
              timezone={timezone}
              onSelect={handleSelect}
              isSelected={selectedTimezones.includes(timezone.ianaName)}
            />
          ))}
        </CommandGroup>
        <CommandSeparator />
      </>
    );
  }, [recentTimezones, handleSelect, selectedTimezones]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            ref={triggerRef}
            variant="outline" 
            role="combobox" 
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Time Zone, City or Town...
            </span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">K</span>
            </kbd>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command className="rounded-lg border-0">
            <CommandInput 
              placeholder="Search timezone..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No timezone found.</CommandEmpty>
              {/* Display recent timezones at the top */}
              {recentTimezoneItems}
              {/* Display search results */}
              {timezoneGroups}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Debug Panel */}
      {DEBUG_MODE && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs font-mono">
          <div className="mb-2 font-bold">Debug Info:</div>
          <div className="mb-1">Search: &ldquo;{search}&rdquo;</div>
          <div className="mb-1">Results: {filteredTimezones.length}</div>
          <div className="mb-1">Selected: {selectedTimezones.join(', ')}</div>
          <div className="mb-1">All Recent: {recentTimezoneNames.join(', ')}</div>
          <div className="mb-1">Filtered Recent: {filteredRecentTimezoneNames.join(', ')}</div>
          {search && filteredTimezones.length > 0 && (
            <div>
              <div className="font-bold mt-2">Top 5 Results:</div>
              <ol className="list-decimal pl-5">
                {filteredTimezones.slice(0, 5).map((tz, i) => (
                  <li key={i}>{tz.label}, {tz.country} ({tz.ianaName})</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </>
  )
} 