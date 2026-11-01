'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[360px] p-5">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-medium">Notifications</SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </SheetHeader>

        <div className="py-8 text-center text-sm text-muted-foreground">
          No notifications
        </div>
      </SheetContent>
    </Sheet>
  );
}
