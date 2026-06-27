'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Topbar } from './topbar';
import { Sidebar } from './sidebar';
import { NotificationPanel } from './notification-panel';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);


  return (
    <div className="flex min-h-screen flex-col bg-card">
      <Topbar 
        onNotificationClick={() => setIsNotificationOpen(!isNotificationOpen)}
        hasUnreadNotifications={true}
        onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        
        <main key={isAuthenticated ? 'auth' : 'anon'} className="flex-1 overflow-y-auto bg-background">
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
