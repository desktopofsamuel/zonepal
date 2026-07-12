import { Globe2Icon, ClockIcon, UsersIcon } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="mt-auto pt-16 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto w-full mb-12">
        <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gray-50 border border-gray-100">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <ClockIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Visual Timeline</h3>
          <p className="text-sm text-gray-600">
            See time differences at a glance with our interactive timeline view
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gray-50 border border-gray-100">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <UsersIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Meeting Scheduler</h3>
          <p className="text-sm text-gray-600">
            Find overlapping work hours and avoid scheduling during blocked times
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gray-50 border border-gray-100">
          <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
            <Globe2Icon className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Weather Info</h3>
          <p className="text-sm text-gray-600">
            Get current weather conditions for each timezone location
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Pro tip: Use keyboard shortcuts for faster navigation
        </p>
        <div className="flex flex-wrap justify-center items-center gap-3 mt-3">
          <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">K</kbd>
          <span className="text-xs text-gray-500">Search</span>
          <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">S</kbd>
          <span className="text-xs text-gray-500">Sort</span>
          <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">R</kbd>
          <span className="text-xs text-gray-500">Reset time</span>
          <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">E</kbd>
          <span className="text-xs text-gray-500">Edit mode</span>
        </div>
      </div>
    </footer>
  );
}