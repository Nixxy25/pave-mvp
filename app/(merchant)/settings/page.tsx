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
      <div className="h-8 w-8 animate-spin border-4 border-gray-200 border-t-[var(--pave-orange)]" />
    </div>
  );
}
