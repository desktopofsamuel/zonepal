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
    dstOffset: tzInfo?.dstOffset || 0
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