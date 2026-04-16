'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  CheckCircle,
  Code,
  FileText,
  User,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
      { href: '/settlement', label: 'Settlement', icon: TrendingUp },
      { href: '/withdrawals', label: 'Withdrawals', icon: CheckCircle },
    ],
  },
  {
    title: 'Developer',
    items: [
      { href: '/api-webhooks', label: 'API & Webhooks', icon: Code },
      { href: '/logs', label: 'Logs', icon: FileText },
    ],
  },
];

const bottomItems = [
  { href: '/account', label: 'Account', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {        const { getUserProfile } = await import('@/lib/api');
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
    <aside className="flex w-[216px] flex-shrink-0 flex-col gap-0.5 overflow-y-auto border-r bg-card p-2.5">
      {navSections.map((section) => (
        <div key={section.title}>
          <div className="px-2.5 pb-1 pt-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
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
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] transition-all',
                  isActive
                    ? 'bg-[var(--pave-orange-light)] font-medium text-[var(--pave-orange)]'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className={cn(
                  'h-[15px] w-[15px] flex-shrink-0',
                  isActive && 'stroke-[var(--pave-orange)]'
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
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] transition-all',
              isActive
                ? 'bg-[var(--pave-orange-light)] font-medium text-[var(--pave-orange)]'
                : 'text-muted-foreground hover:bg-muted dark:hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="h-[15px] w-[15px] flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto">
        <Link href="/account" className="flex cursor-pointer items-center gap-2.5 rounded-md p-2.5 transition-all hover:bg-gray-50">
          <Avatar className="h-7 w-7 flex-shrink-0 bg-gradient-to-br from-[var(--pave-orange)] to-[#ff8a00]">
            <AvatarFallback className="bg-transparent text-[11px] font-medium text-white">
              {user ? getInitials(user.name) : '...'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-[12.5px] font-medium text-foreground">
              {user ? user.name.split(' ')[0] : 'Loading...'}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {user ? user.plan : 'Plan'}
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
