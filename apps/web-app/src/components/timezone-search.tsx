import { PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { TimeZoneInfo, timezoneDatabase, withDisplayLocation } from "@/lib/timezone";
import { searchTimezones } from "@/lib/timezone-search";
import { getRecentTimezones } from "@/lib/utils";

// Debug mode flag - set to true to show debug panel
const DEBUG_MODE = false;

interface TimezoneSearchProps {
  onSelect: (timezone: TimeZoneInfo) => void;
  selectedTimezones?: string[]; // Array of selected IANA timezone names
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

interface TimezoneCityResult {
  id: string;
  timezone: TimeZoneInfo;
  city: string;
}

interface GroupedTimezones {
  [key: string]: TimezoneCityResult[];
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().trim();
}

function getCityRows(
  timezone: TimeZoneInfo,
  search: string,
): TimezoneCityResult[] {
  const cities = [timezone.label, ...(timezone.aliases || [])];
  const normalizedSearch = normalizeSearchText(search);
  const matchingCities = normalizedSearch
    ? cities.filter((city) =>
        normalizeSearchText(city).includes(normalizedSearch),
      )
    : cities;

  const visibleCities = matchingCities.length > 0 ? matchingCities : cities;

  return visibleCities.map((city) => ({
    id: `${timezone.ianaName}:${city}`,
    timezone,
    city,
  }));
}

// Memoized timezone item component
const TimezoneItem = React.memo(
  ({
    cityResult,
    onSelect,
    isSelected,
  }: {
    cityResult: TimezoneCityResult;
    onSelect: (value: string) => void;
    isSelected: boolean;
  }) => {
    const { timezone, city } = cityResult;

    return (
      <CommandItem
        value={`${city} ${timezone.label} ${timezone.ianaName} ${timezone.country}`}
        onSelect={() => onSelect(cityResult.id)}
        disabled={isSelected}
        className={isSelected ? "cursor-not-allowed opacity-50" : ""}
      >
        <span className="flex w-full items-center justify-between">
          <span className="flex items-center gap-2">
            {isSelected && (
              <CheckIcon className="text-muted-foreground h-4 w-4" />
            )}
            <span className="flex flex-col">
              <span>{city}</span>
              <span className="text-muted-foreground text-xs">
                {timezone.country}{" "}
                {timezone.countryCode ? `(${timezone.countryCode})` : ""}
              </span>
            </span>
          </span>
          <span className="text-muted-foreground ml-2 text-xs">
            {timezone.timezone}
          </span>
        </span>
      </CommandItem>
    );
  },
);

TimezoneItem.displayName = "TimezoneItem";

// Memoized timezone group component
const TimezoneGroup = React.memo(
  ({
    region,
    timezones,
    onSelect,
    selectedTimezones,
  }: {
    region: string;
    timezones: TimezoneCityResult[];
    onSelect: (value: string) => void;
    selectedTimezones: string[];
  }) => (
    <CommandGroup heading={region}>
      {timezones.map((timezone) => (
        <TimezoneItem
          key={timezone.id}
          cityResult={timezone}
          onSelect={onSelect}
          isSelected={selectedTimezones.includes(timezone.timezone.ianaName)}
        />
      ))}
    </CommandGroup>
  ),
);

TimezoneGroup.displayName = "TimezoneGroup";

export function TimezoneSearch({
  onSelect,
  selectedTimezones = [],
  triggerRef,
}: TimezoneSearchProps) {
  const [search, setSearch] = React.useState("");
  const [lastSelected, setLastSelected] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [recentTimezones, setRecentTimezones] = React.useState<TimeZoneInfo[]>(
    [],
  );

  const availableTimezones = React.useMemo(() => timezoneDatabase, []);

  // Load recent timezones
  React.useEffect(() => {
    if (open) {
      const recentIanaNames = getRecentTimezones();

      // Filter out already selected timezones
      const filteredRecentNames = recentIanaNames.filter(
        (name) => !selectedTimezones.includes(name),
      );

      // Convert IANA names to timezone objects
      const timezones = filteredRecentNames
        .map((name) => timezoneDatabase.find((tz) => tz.ianaName === name))
        .filter((tz): tz is TimeZoneInfo => tz !== undefined);

      setRecentTimezones(timezones);
    }
  }, [open, selectedTimezones]);

  // Filter timezones based on search
  const filteredTimezones = React.useMemo(() => {
    if (!search) {
      return availableTimezones;
    }

    const matches = searchTimezones(availableTimezones, search);

    // Log first 5 broad matches
    if (DEBUG_MODE) {
      console.log("Broad matches for:", search);
      console.log(
        matches
          .slice(0, 5)
          .map((tz) => `${tz.label}, ${tz.country} (${tz.ianaName})`),
      );
    }

    return matches;
  }, [availableTimezones, search]);

  // Get recent timezones for debug panel
  const recentTimezoneNames = React.useMemo(() => {
    return getRecentTimezones();
  }, []); // Remove the unnecessary 'open' dependency

  // Get filtered recent timezones for debug panel
  const filteredRecentTimezoneNames = React.useMemo(() => {
    return recentTimezoneNames.filter(
      (name) => !selectedTimezones.includes(name),
    );
  }, [recentTimezoneNames, selectedTimezones]);

  // Group timezones by region and sort by country
  const groupedTimezones = React.useMemo(() => {
    const groups: GroupedTimezones = {};

    const cityResults = filteredTimezones.flatMap((tz) =>
      getCityRows(tz, search),
    );

    // First group by region
    cityResults.forEach((result) => {
      // For country searches, group by country instead of region
      const isCountrySearch = filteredTimezones.every(
        (t) => t.country === filteredTimezones[0].country,
      );
      const groupKey = isCountrySearch
        ? result.timezone.country
        : result.timezone.region;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(result);
    });

    // Sort timezones within each group
    Object.keys(groups).forEach((groupKey) => {
      groups[groupKey].sort((a, b) => {
        // If it's a country search, sort by city name only
        if (a.timezone.country === b.timezone.country) {
          return a.city.localeCompare(b.city);
        }
        // Otherwise, sort by country then city
        const countryCompare = a.timezone.country.localeCompare(
          b.timezone.country,
        );
        return countryCompare !== 0
          ? countryCompare
          : a.city.localeCompare(b.city);
      });
    });

    return groups;
  }, [filteredTimezones, search]);

  // Memoize the handleSelect function
  const handleSelect = React.useCallback(
    (value: string) => {
      if (!value || value === lastSelected) return;

      try {
        const [ianaName, ...cityParts] = value.split(":");
        const selectedTimezone = timezoneDatabase.find(
          (tz) => tz.ianaName === ianaName,
        );
        if (!selectedTimezone) return;

        const selectedCity = cityParts.join(":") || selectedTimezone.label;
        const displayedTimezone = withDisplayLocation(
          selectedTimezone,
          selectedCity,
        );

        // Update state in a more controlled way
        setLastSelected(value);
        setSearch(""); // Reset search first
        setOpen(false); // Close popover after selection
        // Use requestAnimationFrame to ensure state updates are processed before callback
        requestAnimationFrame(() => {
          onSelect(displayedTimezone);
        });
      } catch (error) {
        // Silent error handling
      }
    },
    [onSelect, lastSelected],
  );

  // Memoize the timezone groups rendering
  const timezoneGroups = React.useMemo(
    () =>
      Object.entries(groupedTimezones || {}).map(([region, timezones]) => (
        <TimezoneGroup
          key={region}
          region={region}
          timezones={timezones}
          onSelect={handleSelect}
          selectedTimezones={selectedTimezones}
        />
      )),
    [groupedTimezones, handleSelect, selectedTimezones],
  );

  // Memoize the recent timezones rendering
  const recentTimezoneItems = React.useMemo(() => {
    if (recentTimezones.length === 0) return null;

    return (
      <>
        <CommandGroup heading="Recent">
          {recentTimezones.map((timezone) => (
            <TimezoneItem
              key={`recent-${timezone.ianaName}`}
              cityResult={{
                id: `recent-${timezone.ianaName}`,
                timezone,
                city: timezone.label,
              }}
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
            <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100">
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
        <div className="mt-4 rounded-md bg-gray-100 p-3 font-mono text-xs">
          <div className="mb-2 font-bold">Debug Info:</div>
          <div className="mb-1">Search: &ldquo;{search}&rdquo;</div>
          <div className="mb-1">Results: {filteredTimezones.length}</div>
          <div className="mb-1">Selected: {selectedTimezones.join(", ")}</div>
          <div className="mb-1">
            All Recent: {recentTimezoneNames.join(", ")}
          </div>
          <div className="mb-1">
            Filtered Recent: {filteredRecentTimezoneNames.join(", ")}
          </div>
          {search && filteredTimezones.length > 0 && (
            <div>
              <div className="mt-2 font-bold">Top 5 Results:</div>
              <ol className="list-decimal pl-5">
                {filteredTimezones.slice(0, 5).map((tz, i) => (
                  <li key={i}>
                    {tz.label}, {tz.country} ({tz.ianaName})
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </>
  );
}
