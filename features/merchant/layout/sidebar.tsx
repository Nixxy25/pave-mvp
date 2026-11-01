'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ShoppingBag,
  Landmark,
  User,
  X,
} from 'lucide-react';
import { PaveLogo } from '@/components/brand/PaveLogo';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/features/merchant/auth/AuthContext';
import { SignInButton } from '@/features/merchant/components/SignInButton';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Payments',
    items: [
      { href: '/payments', label: 'Payments', icon: CreditCard },
      { href: '/checkout-links', label: 'Checkout Links', icon: ShoppingBag },
      { href: '/settlement', label: 'Settlement', icon: Landmark },
    ],
  },
];

const bottomItems = [
  { href: '/account', label: 'Account', icon: User },
];

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    onMobileClose?.();
  }, [pathname]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarContent = (
    <>
      {navSections.map((section) => (
        <div key={section.title}>
          <div className="px-2.5 pb-1.5 pt-4 first:pt-1">
            <span className="text-xs font-medium text-text-muted">
              {section.title}
            </span>
          </div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--pave-orange-light)] font-medium text-[var(--pave-orange)]'
                    : 'text-text-secondary hover:bg-muted hover:text-text-primary'
                )}
              >
                <Icon className={cn(
                  'size-4 shrink-0 stroke-[1.75]',
                )} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="my-2 h-px bg-[var(--border)]" />

      {bottomItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
              isActive
                ? 'bg-[var(--pave-orange-light)] font-medium text-[var(--pave-orange)]'
                : 'text-text-secondary hover:bg-muted hover:text-text-primary'
            )}
          >
            <Icon className="size-4 shrink-0 stroke-[1.75]" />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto">
        {isAuthenticated && user ? (
          <Link href="/account" className="flex cursor-pointer items-center gap-2.5 p-2.5 transition-all hover:bg-muted">
            <Avatar className="h-7 w-7 flex-shrink-0 bg-gradient-to-br from-[var(--pave-orange)] to-[#ff8a00]">
              <AvatarFallback className="bg-transparent text-[11px] font-medium text-white">
                {getInitials(user.fullName || user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-text-primary">
                {user.fullName?.split(' ')[0] || user.email.split('@')[0]}
              </div>
              <div className="truncate text-[11px] text-text-muted">
                {user.email}
              </div>
            </div>
          </Link>
        ) : (
          <div className="border border-dashed p-3">
            <p className="mb-2 text-center text-xs text-muted-foreground">Sign in to access all features</p>
            <SignInButton size="sm" className="w-full" />
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-[216px] flex-shrink-0 flex-col gap-0.5 overflow-y-auto border-r bg-card p-2.5 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          
          {/* Sidebar */}
          <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col gap-0.5 overflow-y-auto bg-card p-2.5 shadow-xl animate-in slide-in-from-left duration-300">
            {/* Close button */}
            <div className="mb-2 flex items-center justify-between px-2.5 pt-1">
              <PaveLogo size={26} />
              <button 
                aria-label="Close navigation"
                onClick={onMobileClose}
                className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5 stroke-[1.75]" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
