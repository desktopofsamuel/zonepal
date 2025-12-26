'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { LoginDialog } from './login-dialog';

export function UserMenu() {
  const { user, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <UserIcon className="h-4 w-4" />
      </Button>
    );
  }

  if (!user) {
    return <LoginDialog />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <UserIcon className="h-4 w-4 mr-2" />
          {user.displayName || user.email?.split('@')[0] || 'User'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="p-4">
          <div className="flex flex-col space-y-1 mb-3">
            <p className="text-sm font-medium">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500">
              {user.email}
            </p>
          </div>
          <hr className="mb-3" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="w-full justify-start p-2"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}