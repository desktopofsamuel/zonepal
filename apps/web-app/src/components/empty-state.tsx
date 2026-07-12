import { Globe2Icon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddTimezone: () => void;
}

export function EmptyState({ onAddTimezone }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-8">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <Globe2Icon className="h-24 w-24 text-gray-400 relative z-10" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
        No timezones added yet
      </h2>
      
      <p className="text-gray-600 text-center max-w-md mb-8">
        Start by adding timezones to compare and find the perfect meeting time across different locations.
      </p>
      
      <Button 
        onClick={onAddTimezone}
        size="lg"
        className="group"
      >
        <SearchIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
        Add your first timezone
        <span className="ml-2 text-gray-400 font-normal">(Press K)</span>
      </Button>
    </div>
  );
}