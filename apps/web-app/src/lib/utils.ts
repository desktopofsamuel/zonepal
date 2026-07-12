import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Constants for localStorage
const RECENT_TIMEZONES_KEY = 'zonepal_recent_timezones';
const MAX_RECENT_TIMEZONES = 5;

// Get recent timezones from localStorage
export function getRecentTimezones(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(RECENT_TIMEZONES_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading recent timezones:', error);
    return [];
  }
}

// Add a timezone to recent list
export function addToRecentTimezones(ianaName: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const recent = getRecentTimezones();
    
    // Remove if already exists (to move to front)
    const filtered = recent.filter(tz => tz !== ianaName);
    
    // Add to front of array
    const updated = [ianaName, ...filtered].slice(0, MAX_RECENT_TIMEZONES);
    
    localStorage.setItem(RECENT_TIMEZONES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent timezones:', error);
  }
}

// Add multiple timezones to recent list (for URL params)
export function addMultipleToRecentTimezones(ianaNames: string[]): void {
  if (typeof window === 'undefined' || !ianaNames.length) return;
  
  try {
    let recent = getRecentTimezones();
    
    // Process in reverse order so the first timezone in the array ends up at the front
    for (let i = ianaNames.length - 1; i >= 0; i--) {
      const ianaName = ianaNames[i];
      // Remove if already exists (to move to front)
      recent = recent.filter(tz => tz !== ianaName);
      // Add to front
      recent = [ianaName, ...recent];
    }
    
    // Trim to max length
    const updated = recent.slice(0, MAX_RECENT_TIMEZONES);
    
    localStorage.setItem(RECENT_TIMEZONES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent timezones from URL:', error);
  }
}
