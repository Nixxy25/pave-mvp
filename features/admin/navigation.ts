import {
  Activity,
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  Landmark,
  Settings,
  Store,
} from 'lucide-react';

export const ADMIN_NAVIGATION = [
  { slug: '', label: 'Overview', icon: LayoutDashboard },
  { slug: 'transactions', label: 'Transactions', icon: CreditCard },
  { slug: 'merchants', label: 'Merchants', icon: Store },
  { slug: 'treasury', label: 'Treasury', icon: Landmark },
  { slug: 'payouts', label: 'Payouts', icon: ArrowLeftRight },
  { slug: 'monitoring', label: 'System Monitoring', icon: Activity },
  { slug: 'settings', label: 'Settings', icon: Settings },
] as const;

export type AdminSection = (typeof ADMIN_NAVIGATION)[number]['slug'];
