'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('Email verified successfully! Please sign in with your credentials.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--pave-orange)]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }


  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.name === 'UserNotFoundException') {
        setError('No account found with this email address');
      } else if (err.name === 'NotAuthorizedException') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.name === 'UserNotConfirmedException') {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      } else {
        setError(err.message || 'An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError('Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      {/* Top accent bar */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[var(--pave-orange)] to-[#ff8a00]" />
      
      {/* Theme Toggle */}
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

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

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="mb-4 h-12 w-full gap-3 border-gray-300 font-medium"
        >
          {isGoogleLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">or sign in with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">
              {success}
            </div>
          )}
          
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
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Sign in
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
              </>
            )}
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