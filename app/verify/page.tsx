'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/theme-toggle';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmAccount, resendCode } = useAuth();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);

    try {
      await confirmAccount(email, code);
      
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 1500);
    } catch (err: any) {
      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code. Please try again.');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.');
      } else if (err.name === 'UserNotFoundException') {
        setError('Account not found. Please check your email and try again.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      await resendCode(email);
      setSuccess('A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Theme Toggle */}
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a verification code to
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Verification Code
              </label>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="h-12 text-center text-xl tracking-widest"
                maxLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full bg-[var(--pave-orange)] font-medium text-white hover:bg-[var(--pave-orange-hover)]"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Verify & Continue'
              )}
            </Button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              <button
                onClick={handleResendCode}
                disabled={isResending}
                className="font-medium text-[var(--pave-orange)] hover:underline disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend'}
              </button>
            </p>
          </div>

          {/* Back to login */}
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--pave-orange)]" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}