import { timezoneDatabase } from './timezone';

// Get major timezones that are commonly used for SEO
export function getMajorTimezones(): string[] {
  const majorTimezones = [
    'America/New_York',        // Eastern Time (US)
    'America/Chicago',         // Central Time (US)
    'America/Denver',          // Mountain Time (US)
    'America/Los_Angeles',     // Pacific Time (US)
    'America/Toronto',         // Eastern Time (Canada)
    'America/Vancouver',       // Pacific Time (Canada)
    'America/Mexico_City',     // Central Time (Mexico)
    'America/Sao_Paulo',       // Brazil Time
    'America/Buenos_Aires',    // Argentina Time
    'Europe/London',           // GMT/BST
    'Europe/Paris',            // Central European Time
    'Europe/Berlin',           // Central European Time
    'Europe/Madrid',           // Central European Time
    'Europe/Rome',             // Central European Time
    'Europe/Amsterdam',        // Central European Time
    'Europe/Zurich',           // Central European Time
    'Europe/Stockholm',        // Central European Time
    'Europe/Warsaw',           // Central European Time
    'Europe/Athens',           // Eastern European Time
    'Europe/Istanbul',         // Turkey Time
    'Europe/Moscow',           // Moscow Time
    'Asia/Dubai',              // Gulf Standard Time
    'Asia/Kolkata',            // India Standard Time
    'Asia/Singapore',          // Singapore Time
    'Asia/Hong_Kong',          // Hong Kong Time
    'Asia/Shanghai',           // China Standard Time
    'Asia/Tokyo',              // Japan Standard Time
    'Asia/Seoul',              // Korea Standard Time
    'Australia/Sydney',        // Australian Eastern Time
    'Australia/Melbourne',     // Australian Eastern Time
    'Australia/Perth',         // Australian Western Time
    'Europe/Sarajevo',         // Bosnia and Herzegovina Time
    'Africa/Nicosia',          // Cyprus Time (Limassol is in Cyprus)
    'Pacific/Auckland',        // New Zealand Time
    'Pacific/Honolulu',        // Hawaii Time
    'Africa/Johannesburg',     // South Africa Time
    'Africa/Cairo',            // Egypt Time
    'Africa/Lagos',            // West Africa Time
    'UTC'                      // Coordinated Universal Time
  ];

  // Filter to only include timezones that exist in our database
  return majorTimezones.filter(tz => 
    timezoneDatabase.some(dbTz => dbTz.ianaName === tz)
  );
}

// Generate all unique pairs of major timezones for static paths
export function generateTimezonePairs(): Array<[string, string]> {
  const majorTimezones = getMajorTimezones();
  const pairs: Array<[string, string]> = [];
  
  // Generate all unique combinations (not permutations)
  for (let i = 0; i < majorTimezones.length; i++) {
    for (let j = i + 1; j < majorTimezones.length; j++) {
      pairs.push([majorTimezones[i], majorTimezones[j]]);
    }
  }
  
  return pairs;
}

// Convert timezone ID to URL-friendly slug
export function timezoneToSlug(timezone: string): string {
  return timezone.toLowerCase().replace(/\//g, '-').replace(/_/g, '-');
}

// Convert URL slug back to timezone ID
export function slugToTimezone(slug: string): string {
  // First check if it's a direct match (already in correct format)
  if (timezoneDatabase.some(tz => tz.ianaName === slug)) {
    return slug;
  }
  
  // Try to find a match by converting the slug
  const normalizedSlug = slug.toLowerCase();
  
  // Check all possible timezone formats
  for (const tz of timezoneDatabase) {
    if (timezoneToSlug(tz.ianaName) === normalizedSlug) {
      return tz.ianaName;
    }
  }
  
  // If no match found, try to reconstruct the timezone
  // Most timezone IDs follow the pattern Region/City
  const parts = slug.split('-');
  if (parts.length >= 2) {
    // Try different combinations
    const possibleTimezones = [
      `${parts[0]}/${parts.slice(1).join('_')}`, // america-new_york -> America/New_York
      `${parts[0]}/${parts.slice(1).join('-')}`, // america-new-york -> America/New-York
      `${parts[0]}/${parts[1]}`, // Simple two-part
    ];
    
    for (const possible of possibleTimezones) {
      const capitalized = possible
        .split('/')
        .map(part => part.split(/[-_]/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('_'))
        .join('/');
      
      if (timezoneDatabase.some(tz => tz.ianaName === capitalized)) {
        return capitalized;
      }
    }
  }
  
  // Default to the original slug if no match found
  return slug;
}

// Get SEO-friendly title for timezone comparison
export function getTimezoneComparisonTitle(tz1: string, tz2: string): string {
  const tz1Info = timezoneDatabase.find(tz => tz.ianaName === tz1);
  const tz2Info = timezoneDatabase.find(tz => tz.ianaName === tz2);
  
  if (!tz1Info || !tz2Info) {
    return 'Timezone Comparison - ZonePal';
  }
  
  const tz1Name = tz1Info.label;
  const tz2Name = tz2Info.label;
  
  return `${tz1Name} to ${tz2Name} Time Converter - ZonePal`;
}

// Get SEO-friendly description for timezone comparison
export function getTimezoneComparisonDescription(tz1: string, tz2: string): string {
  const tz1Info = timezoneDatabase.find(tz => tz.ianaName === tz1);
  const tz2Info = timezoneDatabase.find(tz => tz.ianaName === tz2);
  
  if (!tz1Info || !tz2Info) {
    return 'Compare timezones and schedule meetings across different time zones with ZonePal.';
  }
  
  const tz1Name = tz1Info.label;
  const tz2Name = tz2Info.label;
  const tz1Country = tz1Info.country;
  const tz2Country = tz2Info.country;
  
  return `Convert time between ${tz1Name} (${tz1Country}) and ${tz2Name} (${tz2Country}). Find the best meeting times and manage schedules across timezones with our visual timezone converter.`;
}

// Get canonical URL for timezone comparison
export function getCanonicalUrl(tz1: string, tz2: string): string {
  const slug1 = timezoneToSlug(tz1);
  const slug2 = timezoneToSlug(tz2);
  
  // Always put them in alphabetical order for canonical URL
  const [first, second] = [slug1, slug2].sort();
  
  return `https://zonepal.com/${first}/${second}`;
}

// Get structured data for timezone comparison page
export function getStructuredData(tz1: string, tz2: string) {
  const description = getTimezoneComparisonDescription(tz1, tz2);
  const url = getCanonicalUrl(tz1, tz2);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ZonePal',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    description: description,
    url: url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    featureList: [
      'Visual timeline comparison',
      'Meeting scheduler',
      'Blocked hours management',
      'Weather information',
      'Mobile responsive'
    ]
  };
}