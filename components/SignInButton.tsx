'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface SignInButtonProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function SignInButton({ size = 'sm', className = '', variant = 'default' }: SignInButtonProps) {
  const { login } = useAuth();

  return (
    <Button
      onClick={login}
      size={size}
      variant={variant}
      className={className || 'h-8 bg-[var(--pave-orange)] px-4 text-[13px] font-medium text-white hover:bg-[#d4522a]'}
    >
      Sign In
    </Button>
  );
}
