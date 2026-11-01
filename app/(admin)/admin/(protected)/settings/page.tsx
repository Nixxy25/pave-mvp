import { AdminPlaceholder } from '@/features/admin/components/AdminPlaceholder';

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholder
      title="Settings"
      description="Administrative configuration status. Dashboard settings are read-only in this stage."
      notice="Access is controlled by the server-side Pave Admin allowlists and the existing Privy-authenticated Admin session."
      sections={[
        { title: 'Super Admin access', status: process.env.PAVE_SUPER_ADMIN_USER_IDS ? 'Configured' : 'Not configured', detail: 'User IDs remain server-side and are not displayed in the dashboard.' },
        { title: 'Admin access', status: process.env.PAVE_ADMIN_USER_IDS ? 'Configured' : 'Not configured', detail: 'User IDs remain server-side and are not displayed in the dashboard.' },
        { title: 'Role management', status: 'Not implemented', detail: 'This dashboard does not modify access lists or roles.' },
        { title: 'Payment configuration', status: 'Read-only', detail: 'No checkout destinations, merchant wallets, or payment settings are changed here.' },
      ]}
    />
  );
}
