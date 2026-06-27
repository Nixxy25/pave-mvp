'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { SignInButton } from '@/components/SignInButton';

interface TopbarProps {
  onNotificationClick?: () => void;
  hasUnreadNotifications?: boolean;
  onMenuClick?: () => void;
}

export function Topbar({ onNotificationClick, hasUnreadNotifications = false, onMenuClick }: TopbarProps) {
  const { user, isAuthenticated } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 flex h-[58px] items-center justify-between border-b bg-card px-4 md:px-7">
      <div className="flex items-center gap-1">
        <Link href="/dashboard">
          <Image src="/pave2.png" alt="Pave" width={70} height={28} className="object-contain" />
        </Link>

        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden " onClick={onMenuClick}>
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <Badge
          variant="outline"
          className="hidden border-[#c7d2fe] bg-[#eef2ff] font-mono text-[11.5px] text-[#3b5bdb] sm:flex"
        >
          <div className="mr-1.5 h-1.5 w-1.5 animate-blink rounded-full bg-[#3b5bdb]" />
          Testnet
        </Badge>

        <ThemeToggle />

        {isAuthenticated ? (
          <>
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
                  {user ? getInitials(user.fullName || user.email) : '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        ) : (
          <SignInButton />
        )}
      </div>
    </nav>
  );
}

