import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TimelineSettings } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { usePostHog } from 'posthog-js/react'
import { trackEvent, EventCategory, EventAction } from '@/lib/analytics'

interface SettingsDialogProps {
  settings: TimelineSettings;
  onSettingsChange: (settings: TimelineSettings) => void;
  // Keeping these in the interface but marking as optional in case they're needed in the future
  timeZones?: { name: string; ianaName: string }[];
  pinnedTimezone?: string | null;
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: i === 0 ? "12 AM" : i === 12 ? "12 PM" : i > 12 ? `${i - 12} PM` : `${i} AM`
}));

interface TimeBlock {
  start: number;
  end: number;
}

export function SettingsDialog({ settings, onSettingsChange }: SettingsDialogProps) {
  const posthog = usePostHog();
  const [open, setOpen] = React.useState(false);
  const [timeBlocks, setTimeBlocks] = React.useState<TimeBlock[]>(() => {
    // Initialize with existing blocks from settings
    if (settings.blockedTimeSlots.length > 0) {
      return settings.blockedTimeSlots.map(slot => ({
        start: slot.start,
        end: slot.end
      }));
    }
    // If no blocks, use default blocked hours
    return [{ 
      start: settings.defaultBlockedHours.start,
      end: settings.defaultBlockedHours.end
    }];
  });

  // Track when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    if (newOpen) {
      trackEvent(posthog, EventCategory.SETTINGS, EventAction.TOGGLE, {
        action: 'open_settings',
        current_blocks: timeBlocks.length
      });
    }
  };

  const handleStartHourChange = (value: string, index: number) => {
    const newBlocks = [...timeBlocks];
    newBlocks[index] = {
      ...newBlocks[index],
      start: parseInt(value)
    };
    setTimeBlocks(newBlocks);
  };

  const handleEndHourChange = (value: string, index: number) => {
    const newBlocks = [...timeBlocks];
    newBlocks[index] = {
      ...newBlocks[index],
      end: parseInt(value)
    };
    setTimeBlocks(newBlocks);
  };

  const handleAddBlock = () => {
    const newBlocks = [...timeBlocks, { start: 9, end: 17 }]; // Default 9 AM to 5 PM
    setTimeBlocks(newBlocks);
    
    // Track adding a new block
    trackEvent(posthog, EventCategory.BLOCKED_HOURS, EventAction.ADD, {
      total_blocks: newBlocks.length,
      new_block: '9-17'
    });
  };

  const handleRemoveBlock = (index: number) => {
    if (timeBlocks.length > 1) {
      const blockToRemove = timeBlocks[index];
      const newBlocks = timeBlocks.filter((_, i) => i !== index);
      setTimeBlocks(newBlocks);
      
      // Track removing a block
      trackEvent(posthog, EventCategory.BLOCKED_HOURS, EventAction.REMOVE, {
        total_blocks: newBlocks.length,
        removed_block: `${blockToRemove.start}-${blockToRemove.end}`
      });
    }
  };

  const handleSave = () => {
    // Update settings with all time blocks
    const updatedSettings: TimelineSettings = {
      ...settings,
      blockedTimeSlots: timeBlocks.map(block => ({
        start: block.start,
        end: block.end,
        ianaName: undefined // These are global blocks
      })),
      defaultBlockedHours: timeBlocks[0] // Use first block as default
    };
    
    // Track saving settings
    trackEvent(posthog, EventCategory.SETTINGS, EventAction.UPDATE, {
      total_blocks: timeBlocks.length,
      blocks: timeBlocks.map(block => `${block.start}-${block.end}`),
      has_overnight_blocks: timeBlocks.some(block => block.start > block.end)
    });
    
    onSettingsChange(updatedSettings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0" title="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Timeline Settings</DialogTitle>
          <DialogDescription>
            Configure your blocked hours. These hours will be marked as unavailable in local time for each timezone. For overnight blocks (e.g., 6 PM to 9 AM), set the end time earlier than the start time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Local time info */}
          {/* <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-4">
            <div className="font-medium mb-1">Local Time Blocks</div>
            <div>
              Blocked hours are shown in local time for each timezone. The same hours will be blocked regardless of timezone.
            </div>
          </div> */}

          {timeBlocks.map((block, index) => (
            <div key={index} className="grid gap-4 relative">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label>Block {index + 1} Start</Label>
                <Select
                  value={block.start.toString()}
                  onValueChange={(value) => handleStartHourChange(value, index)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label>Block {index + 1} End</Label>
                <div className="flex gap-2">
                  <Select
                    value={block.end.toString()}
                    onValueChange={(value) => handleEndHourChange(value, index)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => (
                        <SelectItem key={hour.value} value={hour.value}>
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {timeBlocks.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveBlock(index)}
                      className="shrink-0"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {block.start > block.end && (
                <div className="text-xs text-blue-500 mt-1">
                  This block spans overnight (from {HOURS[block.start].label} to {HOURS[block.end].label} next day)
                </div>
              )}
              {index < timeBlocks.length - 1 && <hr className="my-4" />}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={handleAddBlock}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Another Block
          </Button>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 