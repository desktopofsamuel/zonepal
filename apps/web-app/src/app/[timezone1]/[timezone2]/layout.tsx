import { ReactNode } from 'react';
import { slugToTimezone, getStructuredData } from '@/lib/timezone-seo';
import { findTimezoneByIana } from '@/lib/timezone';
import Script from 'next/script';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    timezone1: string;
    timezone2: string;
  }>;
}

export default async function TimezoneLayout({ children, params }: LayoutProps) {
  const { timezone1: slug1, timezone2: slug2 } = await params;
  
  const tz1 = slugToTimezone(slug1);
  const tz2 = slugToTimezone(slug2);
  
  // Validate timezones
  const tz1Info = findTimezoneByIana(tz1);
  const tz2Info = findTimezoneByIana(tz2);
  
  // Only add structured data if both timezones are valid
  const structuredData = tz1Info && tz2Info ? getStructuredData(tz1, tz2) : null;
  
  return (
    <>
      {structuredData && (
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      {children}
    </>
  );
}