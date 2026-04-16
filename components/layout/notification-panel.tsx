'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getNotifications } from '@/lib/api';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isOpen) {
      getNotifications().then(setNotifications);
    }
  }, [isOpen]);

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

        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'cursor-pointer rounded-lg border p-3.5 transition-colors hover:bg-muted',
                notification.read 
                  ? 'border-[var(--border)] bg-card' 
                  : 'border-[var(--pave-orange-medium)] bg-[var(--pave-orange-light)]'
              )}
            >
              <div className="mb-0.5 text-[13px] font-medium text-foreground">
                {notification.title}
              </div>
              <div className="text-[12px] text-muted-foreground">
                {notification.description}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                {new Date(notification.timestamp || notification.createdAt || Date.now()).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
