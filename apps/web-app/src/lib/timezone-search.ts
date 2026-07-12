import type { TimeZoneInfo } from './timezone'

function getSearchableText(timezone: TimeZoneInfo): string {
  return [
    timezone.label,
    ...(timezone.aliases || []),
    timezone.region,
    timezone.country,
    timezone.countryCode,
    timezone.timezone,
    timezone.ianaName,
  ]
    .join(' ')
    .toLowerCase()
}

export function searchTimezones(
  timezones: TimeZoneInfo[],
  search: string,
): TimeZoneInfo[] {
  const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean)

  if (searchTerms.length === 0) {
    return timezones
  }

  const exactMatches = timezones.filter(timezone => {
    const names = [timezone.label, ...(timezone.aliases || [])]
    return names.some(name => name.toLowerCase() === searchTerms.join(' '))
  })

  if (exactMatches.length > 0) {
    return exactMatches
  }

  const partialMatches = timezones.filter(timezone => {
    const searchableText = getSearchableText(timezone)
    return searchTerms.every(term => searchableText.includes(term))
  })

  if (partialMatches.length > 0) {
    return partialMatches
  }

  return timezones.filter(timezone => {
    const searchableText = getSearchableText(timezone)
    return searchTerms.some(term => searchableText.includes(term))
  })
}
