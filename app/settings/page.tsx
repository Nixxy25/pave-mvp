'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    webhookUrl: '',
    emailNotifications: true,
    stellarExplorerLinks: true,
    autoConvert: false,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 pb-20 sm:px-7 sm:py-8">
      <div className="mb-6 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          Settings
        </div>
        <h1 className="font-serif text-[24px] font-light italic leading-tight tracking-tight text-foreground sm:text-[27px]">
          Account Settings
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Configure your account preferences and integrations
        </p>
      </div>

      <div className="space-y-6">
        {/* Webhooks */}
        <div className="rounded-[14px] border bg-card p-4 shadow-sm animate-fadeup sm:p-6" style={{ animationDelay: '0.07s' }}>
          <h2 className="mb-4 font-serif text-lg font-light italic text-foreground\">
            Webhook Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                placeholder="https://yourapp.com/webhooks/pave"
                className="mt-1.5"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                We'll send POST requests to this URL when events occur (payment.completed, withdrawal.completed, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-[14px] border bg-card p-4 shadow-sm animate-fadeup sm:p-6" style={{ animationDelay: '0.14s' }}>
          <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
            Notifications
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium text-foreground">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive email alerts for important events</div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium text-foreground">Stellar Explorer Links</div>
                <div className="text-sm text-muted-foreground">Show blockchain explorer links in the dashboard</div>
              </div>
              <Switch
                checked={settings.stellarExplorerLinks}
                onCheckedChange={(checked) => setSettings({ ...settings, stellarExplorerLinks: checked })}
              />
            </div>
          </div>
        </div>

        {/* Settlement */}
        <div className="rounded-[14px] border bg-card p-4 shadow-sm animate-fadeup sm:p-6" style={{ animationDelay: '0.21s' }}>
          <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
            Settlement Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium text-foreground">Auto-convert to NGN</div>
                <div className="text-sm text-muted-foreground">Automatically convert USDC to NGN on receipt</div>
              </div>
              <Switch
                checked={settings.autoConvert}
                onCheckedChange={(checked) => setSettings({ ...settings, autoConvert: checked })}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)] sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Sign Out */}
        <div className="rounded-[14px] border bg-card p-4 shadow-sm animate-fadeup sm:p-6" style={{ animationDelay: '0.28s' }}>
          <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
            Sign Out
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="font-medium text-foreground">Sign Out</div>
                <div className="text-sm text-muted-foreground">Sign out of your account</div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
