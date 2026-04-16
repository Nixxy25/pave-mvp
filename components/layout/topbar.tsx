'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

interface TopbarProps {
  onNotificationClick?: () => void;
  hasUnreadNotifications?: boolean;
}

export function Topbar({ onNotificationClick, hasUnreadNotifications = false }: TopbarProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { getUserProfile } = await import('@/lib/api');
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 flex h-[58px] items-center justify-between border-b bg-card px-7">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg">
          <div className="h-full w-full" />
        </div>
        <span className="font-serif text-[21px] font-medium tracking-tight text-foreground">
          Pave
        </span>
      </Link>

      <div className="flex items-center gap-2.5">
        <Badge 
          variant="outline" 
          className="border-[#c7d2fe] bg-[#eef2ff] font-mono text-[11.5px] text-[#3b5bdb]"
        >
          <div className="mr-1.5 h-1.5 w-1.5 animate-blink rounded-full bg-[#3b5bdb]" />
          Testnet
        </Badge>

        <ThemeToggle />

        <Button
          variant="outline"
          size="icon"
          className="relative h-[34px] w-[34px]"
          onClick={onNotificationClick}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {hasUnreadNotifications && (
            <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--pave-orange)] ring-2 ring-white" />
          )}
        </Button>

        <Link href="/account">
          <Avatar className="h-8 w-8 cursor-pointer bg-gradient-to-br from-[var(--pave-orange)] to-[#ff8a00] ring-2 ring-white ring-offset-2 ring-offset-[var(--border)]">
            <AvatarFallback className="bg-transparent text-[11.5px] font-medium text-white">
              {user ? getInitials(user.name) : '...'}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </nav>
  );
}
