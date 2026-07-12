import { Suspense } from 'react';
import { Main } from '@/components/main';

export const metadata = {
  title: 'ZonePal - Timezone Converter',
  description: 'A simple timezone converter for remote teams',
};

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
        <div className="w-full max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-12 w-full bg-gray-200 rounded mb-8"></div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <Main />
    </Suspense>
  );
} 