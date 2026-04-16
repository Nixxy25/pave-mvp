'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    acceptTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.businessName) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('pave_users') || '[]');
      const existingUser = users.find((u: any) => u.email === formData.email);
      
      if (existingUser) {
        setError('An account with this email already exists');
        setLoading(false);
        return;
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        password: formData.password, // In production, this would be hashed
        businessName: formData.businessName,
        createdAt: new Date().toISOString(),
        plan: 'Free',
        apiKey: `pk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        secretKey: `sk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        stellarWalletAddress: `G${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      };

      users.push(newUser);
      localStorage.setItem('pave_users', JSON.stringify(users));

      // Initialize user data
      localStorage.setItem(`pave_payments_${newUser.id}`, JSON.stringify([]));
      localStorage.setItem(`pave_withdrawals_${newUser.id}`, JSON.stringify([]));
      localStorage.setItem(`pave_checkout_links_${newUser.id}`, JSON.stringify([]));
      localStorage.setItem(`pave_api_logs_${newUser.id}`, JSON.stringify([]));
      localStorage.setItem(`pave_notifications_${newUser.id}`, JSON.stringify([]));
      localStorage.setItem(`pave_balance_${newUser.id}`, JSON.stringify({ usdc: 0, ngn: 0 }));

      // Set current user
      localStorage.setItem('pave_current_user', newUser.id);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred during signup');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="mb-8 text-center">
          <div className="mb-2 inline-block rounded-xl bg-gradient-to-r from-[var(--pave-orange)] to-orange-600 px-4 py-1.5">
            <span className="font-mono text-sm font-semibold tracking-wide text-white">PAVE</span>
          </div>
          <h1 className="font-serif text-3xl font-light italic text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start accepting payments on Stellar testnet
          </p>
        </div>

        {/* Signup Form */}
        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11"
              />
            </div>

            <div>
              <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium text-foreground">
                Business Name
              </label>
              <Input
                id="businessName"
                type="text"
                placeholder="Your Company Ltd"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="h-11"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-11"
              />
              <p className="mt-1 text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, acceptTerms: checked as boolean })
                }
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="#" className="text-[var(--pave-orange)] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-[var(--pave-orange)] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-gradient-to-r from-[var(--pave-orange)] to-orange-600 font-medium text-white hover:from-orange-600 hover:to-orange-700"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[var(--pave-orange)] hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          By signing up, you'll get instant access to Stellar testnet payments
        </div>
      </div>
    </div>
  );
}
