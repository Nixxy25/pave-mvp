'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('pave_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (!user) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Set current user
      localStorage.setItem('pave_current_user', user.id);
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      {/* Top accent bar */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[var(--pave-orange)] to-[#ff8a00]" />

      <div className="w-full max-w-[480px] animate-fadeup rounded-[20px] border bg-card p-9 shadow-[0_20px_25px_-5px_rgba(0,0,0,.08),0_8px_10px_-6px_rgba(0,0,0,.04)]">
        {/* Logo */}
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg">
            <div className="h-full w-full" />
          </div>
          <span className="font-serif text-[24px] font-medium tracking-tight text-foreground">
            Pave
          </span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-1 font-serif text-[22px] font-light italic text-foreground">
            Welcome back
          </h1>
          <p className="text-[13.5px] text-muted-foreground">
            Sign in to your merchant account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">
              Email address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
              required
            />
          </div>

          <div className="flex items-center justify-between text-[12.5px]">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember"
                className="cursor-pointer text-muted-foreground"
              >
                Remember me
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-[var(--pave-orange)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full bg-[var(--pave-orange)] text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(242,92,0,.2),0_1px_5px_rgba(242,92,0,.12)] hover:bg-[var(--pave-orange-hover)] hover:shadow-[0_2px_8px_rgba(242,92,0,.28)]"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              className="ml-1.5"
            >
              <path
                d="M3 7.5h9M8 3.5l4 4-4 4"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </form>

        <div className="my-6 h-px bg-[var(--border)]" />

        <div className="text-center text-[12.5px] text-muted-foreground">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-[var(--pave-orange)] hover:underline"
          >
            Create one →
          </Link>
        </div>
      </div>
    </div>
  );
}
