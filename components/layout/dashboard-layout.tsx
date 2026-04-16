'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from './topbar';
import { Sidebar } from './sidebar';
import { NotificationPanel } from './notification-panel';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getUserProfile } = await import('@/lib/api');
        const user = await getUserProfile();
        
        if (!user) {
          router.push('/login');
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-3 inline-flex h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--pave-orange)]" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-card">
      <Topbar 
        onNotificationClick={() => setIsNotificationOpen(!isNotificationOpen)}
        hasUnreadNotifications={true}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>

      <NotificationPanel 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </div>
  );
}
