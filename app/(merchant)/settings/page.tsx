'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return (
    <div className="flex h-96 items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-4 border-border border-t-[var(--pave-orange)]" />
    </div>
  );
}
