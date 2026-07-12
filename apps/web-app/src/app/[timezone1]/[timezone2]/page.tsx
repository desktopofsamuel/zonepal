import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { 
  slugToTimezone, 
  timezoneToSlug,
  getTimezoneComparisonTitle,
  getTimezoneComparisonDescription,
  getCanonicalUrl,
  generateTimezonePairs
} from '@/lib/timezone-seo';
import { findTimezoneByIana } from '@/lib/timezone';

interface PageProps {
  params: Promise<{
    timezone1: string;
    timezone2: string;
  }>;
}

export async function generateStaticParams() {
  const pairs = generateTimezonePairs();
  
  return pairs.map(([tz1, tz2]) => ({
    timezone1: timezoneToSlug(tz1),
    timezone2: timezoneToSlug(tz2),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { timezone1: slug1, timezone2: slug2 } = await params;
  
  const tz1 = slugToTimezone(slug1);
  const tz2 = slugToTimezone(slug2);
  
  // Validate timezones
  const tz1Info = findTimezoneByIana(tz1);
  const tz2Info = findTimezoneByIana(tz2);
  
  if (!tz1Info || !tz2Info) {
    return {
      title: 'Timezone Not Found - ZonePal',
      description: 'The requested timezone comparison could not be found.',
    };
  }
  
  const title = getTimezoneComparisonTitle(tz1, tz2);
  const description = getTimezoneComparisonDescription(tz1, tz2);
  const canonicalUrl = getCanonicalUrl(tz1, tz2);
  
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'ZonePal',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    other: {
      'application-name': 'ZonePal',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
    },
  };
}

export default async function TimezonePage({ params }: PageProps) {
  const { timezone1: slug1, timezone2: slug2 } = await params;
  
  const tz1 = slugToTimezone(slug1);
  const tz2 = slugToTimezone(slug2);
  
  // Validate timezones
  const tz1Info = findTimezoneByIana(tz1);
  const tz2Info = findTimezoneByIana(tz2);
  
  if (!tz1Info || !tz2Info) {
    notFound();
  }
  
  // Create the URL with query parameters that the Main component expects
  const searchParams = new URLSearchParams({
    z: `${tz1},${tz2}`,
    b: '22-6' // Default blocked hours
  });
  
  // Redirect to the main page with the query parameters
  redirect(`/?${searchParams.toString()}`);
}

// Add JSON-LD structured data
export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  };
}