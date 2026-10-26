'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { LogOut } from 'lucide-react';
import { ADMIN_NAVIGATION } from './navigation';
import type { PaveAdminRole } from '@/lib/auth/roles';

interface AdminShellProps {
  children: React.ReactNode;
  role: PaveAdminRole;
}

export function AdminShell({ children, role }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = usePrivy();
  const [basePath, setBasePath] = useState('/admin');
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hostname === 'admin.pavee.co') {
      setBasePath('');
    }
  }, []);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      const response = await fetch('/api/admin/session', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to clear the Admin session.');
      }
      await logout();
      router.replace(basePath ? '/admin/login' : '/login');
      router.refresh();
    } catch (error) {
      console.error('[admin] Failed to end session:', error);
      setLogoutError('Could not end the Admin session. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 flex-col border-r bg-card p-4">
        <Link href={basePath || '/'} className="mb-8 px-3 font-serif text-2xl font-medium">
          Pave Admin
        </Link>
        <nav aria-label="Admin navigation" className="space-y-1">
          {ADMIN_NAVIGATION.map(({ slug, label, icon: Icon }) => {
            const href = slug ? `${basePath}/${slug}` : basePath || '/';
            const isActive = slug
              ? pathname === href || pathname === `/${slug}` || pathname === `/admin/${slug}`
              : pathname === href || pathname === '/admin' || pathname === '/';

            return (
              <Link
                key={label}
                href={href}
                prefetch={false}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--pave-orange-light)] font-medium text-[var(--pave-orange)]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t pt-4">
          <p className="px-3 pb-3 text-xs text-muted-foreground">Access: {role}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          {logoutError && (
            <p role="alert" className="px-3 pt-2 text-xs text-destructive">
              {logoutError}
            </p>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6 sm:p-10">{children}</div>
      </main>
    </div>
  );
}
