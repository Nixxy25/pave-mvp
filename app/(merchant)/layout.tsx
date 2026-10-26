import { DashboardLayout } from '@/features/merchant/layout/dashboard-layout';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
