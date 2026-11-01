'use client';

import Link from 'next/link';
import { PaveLogo } from '@/components/brand/PaveLogo';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/features/merchant/auth/AuthContext';
import { SignInButton } from '@/features/merchant/components/SignInButton';

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
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" aria-label="Open navigation" onClick={onMenuClick}>
          <Menu className="size-5 stroke-[1.75]" />
        </Button>

        <Link href="/dashboard" aria-label="Pave dashboard">
          <PaveLogo size={28} priority />
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <ThemeToggle />

        {isAuthenticated ? (
          <>
            <Button
              variant="outline"
              size="icon"
              className="relative h-[34px] w-[34px]"
              onClick={onNotificationClick}
            >
              <Bell className="size-4 stroke-[1.75] text-text-secondary" />
              {hasUnreadNotifications && (
                <span className="absolute right-2 top-1.5 size-1.5 rounded-full bg-[var(--pave-orange)] ring-2 ring-card" />
              )}
            </Button>

            <Link href="/account">
              <Avatar className="h-8 w-8 cursor-pointer bg-gradient-to-br from-[var(--pave-orange)] to-[#ff8a00]">
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

