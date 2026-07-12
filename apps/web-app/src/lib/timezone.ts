import { formatInTimeZone } from 'date-fns-tz'
import * as ct from 'countries-and-timezones'

export interface TimeZoneInfo {
  name: string;
  location: string;
  timezone: string;
  offset: string;
  time: string;
  date: string;
  ianaName: string;
  value: string;
  label: string;
  region: string;
  country: string;
  countryCode: string;
  utcOffset: number;
  dstOffset: number;
  aliases: string[];
  urlSlug?: string;
}

export function locationToSlug(location: string): string {
  return normalizeLocationName(location).replace(/\s+/g, '-');
}

export function withDisplayLocation(timezone: TimeZoneInfo, location: string): TimeZoneInfo {
  return {
    ...timezone,
    label: location,
    location,
    name: location,
    urlSlug: locationToSlug(location),
  };
}

const timezoneCityAliases: Record<string, string[]> = {
  'America/Los_Angeles': ['San Francisco', 'San Jose', 'Oakland', 'Las Vegas', 'Seattle', 'Portland', 'San Diego'],
  'America/New_York': ['Washington DC', 'Washington D.C.', 'Boston', 'Miami', 'Atlanta', 'Philadelphia', 'Detroit'],
  'America/Chicago': ['Dallas', 'Houston', 'Austin', 'San Antonio', 'Minneapolis', 'New Orleans'],
  'America/Denver': ['Phoenix', 'Salt Lake City', 'Calgary', 'Edmonton'],
  'America/Toronto': ['Ottawa', 'Montreal'],
  'America/Vancouver': ['Victoria'],
  'America/Sao_Paulo': ['Rio de Janeiro', 'Brasilia'],
  'America/Buenos_Aires': ['Cordoba', 'Rosario'],
  'Europe/London': ['Dublin', 'Edinburgh', 'Manchester'],
  'Europe/Paris': ['Brussels', 'Lyon'],
  'Europe/Berlin': ['Frankfurt', 'Munich', 'Hamburg'],
  'Europe/Rome': ['Milan', 'Naples'],
  'Europe/Madrid': ['Barcelona', 'Valencia'],
  'Europe/Amsterdam': ['Rotterdam'],
  'Europe/Zurich': ['Geneva'],
  'Europe/Stockholm': ['Oslo', 'Copenhagen'],
  'Europe/Istanbul': ['Ankara'],
  'Europe/Moscow': ['Saint Petersburg'],
  'Asia/Dubai': ['Abu Dhabi'],
  'Asia/Kolkata': ['Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Chennai'],
  'Asia/Singapore': ['Kuala Lumpur'],
  'Asia/Shanghai': ['Beijing', 'Shenzhen', 'Guangzhou'],
  'Asia/Tokyo': ['Osaka', 'Kyoto'],
  'Asia/Seoul': ['Busan'],
  'Australia/Sydney': ['Canberra', 'Brisbane'],
  'Australia/Melbourne': ['Adelaide'],
  'Africa/Johannesburg': ['Cape Town', 'Pretoria'],
  'Africa/Cairo': ['Alexandria'],
  'Africa/Lagos': ['Abuja', 'Accra'],
};

function normalizeLocationName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugToLocationName(value: string): string {
  return value.replace(/-/g, ' ');
}

function getTimezoneNames(timezone: TimeZoneInfo): string[] {
  return [timezone.ianaName, timezone.label, timezone.name, ...(timezone.aliases || [])];
}


export function getTimeInTimeZone(date: Date, timeZone: string): { time: string; date: string } {
  const time = formatInTimeZone(date, timeZone, 'h:mm a')
  const dateStr = formatInTimeZone(date, timeZone, 'EEE, MMM d')
  return { time, date: dateStr }
}

export function getTimezoneOffset(timeZone: string): string {
  const tzInfo = ct.getTimezone(timeZone);
  return tzInfo ? `GMT${tzInfo.utcOffsetStr}` : '';
}

// Create a shared timezone database
export const timezoneDatabase = Intl.supportedValuesOf('timeZone').map(timezone => {
  const tzInfo = ct.getTimezone(timezone);
  const countryInfo = tzInfo?.countries?.[0] ? ct.getCountry(tzInfo.countries[0]) : null;
  const offset = getTimezoneOffset(timezone);
  const label = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
  const region = timezone.split('/')[0];

  return {
    value: timezone,
    label,
    timezone: offset,
    offset: offset.replace('GMT', ''),
    ianaName: timezone,
    region,
    country: countryInfo?.name || region,
    countryCode: countryInfo?.id || '',
    location: label,
    name: label,
    time: '',
    date: '',
    utcOffset: tzInfo?.utcOffset || 0,
    dstOffset: tzInfo?.dstOffset || 0,
    aliases: timezoneCityAliases[timezone] || []
  };
});

// Group timezones by country for easier lookup
export const timezonesByCountry = Object.values(ct.getAllCountries()).reduce((acc: { [key: string]: TimeZoneInfo[] }, country) => {
  acc[country.name] = country.timezones
    .map(tz => timezoneDatabase.find(t => t.ianaName === tz))
    .filter((tz): tz is TimeZoneInfo => tz !== undefined);
  return acc;
}, {});

// URL parameter handling
export function getTimezoneParam(timezones: TimeZoneInfo[]): string {
  return timezones.map(tz => tz.ianaName).join('-to-');
}

export function parseTimezoneParam(param: string): string[] {
  return param.split('-to-');
}

export function findTimezoneByIana(ianaName: string): TimeZoneInfo | undefined {
  return timezoneDatabase.find(tz => tz.ianaName === ianaName);
}

export function findTimezoneByLocation(location: string): TimeZoneInfo | undefined {
  const normalizedLocation = normalizeLocationName(slugToLocationName(location));

  if (!normalizedLocation) return undefined;

  for (const timezone of timezoneDatabase) {
    const matchedName = getTimezoneNames(timezone).find(
      name => normalizeLocationName(name) === normalizedLocation
    );

    if (matchedName) {
      return withDisplayLocation(timezone, matchedName);
    }
  }

  return undefined;
}

export function findTimezone(ianaNameOrLocation: string): TimeZoneInfo | undefined {
  return findTimezoneByIana(ianaNameOrLocation) || findTimezoneByLocation(ianaNameOrLocation);
}


// New helper functions
export function getTimezonesForCountry(countryCode: string): TimeZoneInfo[] {
  const country = ct.getCountry(countryCode);
  if (!country) return [];

  return country.timezones
    .map(tz => timezoneDatabase.find(t => t.ianaName === tz))
    .filter((tz): tz is TimeZoneInfo => tz !== undefined);
}

export function getCountryForTimezone(timezoneName: string): { code: string; name: string } | null {
  const country = ct.getCountryForTimezone(timezoneName);
  return country ? { code: country.id, name: country.name } : null;
}
