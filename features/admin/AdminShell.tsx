'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import { PaveLogo } from '@/components/brand/PaveLogo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ADMIN_NAVIGATION } from './navigation';
import type { PaveAdminRole } from '@/lib/auth/roles';

interface AdminShellProps {
  children: React.ReactNode;
  role: PaveAdminRole;
}

const basePath = '/admin';

export function AdminShell({ children, role }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = usePrivy();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const current = ADMIN_NAVIGATION.find(({ slug }) => {
    const href = slug ? `${basePath}/${slug}` : basePath || '/';
    return pathname === href || (!slug && (pathname === '/admin' || pathname === '/'));
  });

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      const response = await fetch('/api/admin/session', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to clear the Admin session.');
      await logout();
      router.replace(basePath ? '/admin/login' : '/login');
      router.refresh();
    } catch (error) {
      console.error('[admin] Failed to end session:', error);
      setLogoutError('Could not end the Admin session. Please try again.');
    }
  };

  const navLinks = (mobile = false) => (
    <nav aria-label="Admin navigation" className="space-y-0.5">
      {ADMIN_NAVIGATION.map(({ slug, label, icon: Icon }) => {
        const href = slug ? `${basePath}/${slug}` : basePath || '/';
        const isActive = slug
          ? pathname === href || pathname === `/${slug}` || pathname === `/admin/${slug}`
          : pathname === href || pathname === '/admin' || pathname === '/';
        const link = (
          <Link
            key={label}
            href={href}
            prefetch={false}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-9 items-center gap-3 px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-[var(--pave-orange-light)] font-medium text-[var(--pave-orange)]'
                : 'text-text-secondary hover:bg-muted hover:text-text-primary'
            }`}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0 stroke-[1.75]" />
            {label}
          </Link>
        );
        return mobile ? <SheetClose asChild key={label}>{link}</SheetClose> : link;
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <Link href={basePath || '/'} className="mb-8 flex items-center gap-2 px-3">
          <PaveLogo size={26} priority />
          <span className="rounded-none border border-border px-2 py-0.5 text-[11px] font-medium text-text-secondary">Admin</span>
        </Link>
        {navLinks()}
        <div className="mt-auto border-t pt-4">
          <p className="px-3 pb-3 text-xs text-text-muted">Access: {role}</p>
          <Button type="button" onClick={handleLogout} variant="ghost" className="w-full justify-start">
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open Admin navigation">
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetHeader className="px-2">
                  <SheetTitle className="flex items-center gap-2">
                    <PaveLogo size={24} />
                    <span className="rounded-none border border-border px-2 py-0.5 text-[11px] font-medium text-text-secondary">Admin</span>
                  </SheetTitle>
                </SheetHeader>
                {navLinks(true)}
                <div className="mt-auto border-t pt-4">
                  <p className="px-3 pb-3 text-xs text-text-muted">Access: {role}</p>
                  <Button type="button" onClick={handleLogout} variant="ghost" className="w-full justify-start">
                    <LogOut aria-hidden="true" />
                    Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="text-sm font-semibold text-text-primary">{current?.label ?? 'Admin'}</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-4 stroke-[1.75] text-status-success" />
            <span className="hidden sm:inline">Internal Pave access</span>
            <span className="sm:hidden">{role.replace('_', ' ')}</span>
          </div>
        </header>

        {logoutError && (
          <p role="alert" className="mx-4 mt-3 text-sm text-destructive sm:mx-6">
            {logoutError}
          </p>
        )}

        <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
