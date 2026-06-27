'use client';

import { useState, useEffect } from 'react';
import { createPayment } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@/lib/constants';
import { ShortAddress } from '@/components/ShortAddress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateCheckoutLinkDialogProps {
  onCreated: () => void;
}

// Define select field configurations 
const CURRENCY_OPTIONS = [
  { value: 'NGN', label: 'NGN' },
  { value: 'KES', label: 'KES' },
  { value: 'GHS', label: 'GHS' },
  { value: 'USD', label: 'USD' },
] as const;

const SETTLEMENT_OPTIONS = [
  { value: 'USDC', label: 'USDC (Stellar)' },
  { value: 'XLM', label: 'XLM' },
] as const;

const EXPIRY_OPTIONS = [
  { value: '24', label: '24 hours' },
  { value: '48', label: '48 hours' },
  { value: '168', label: '7 days' },
  { value: '0', label: 'No expiry' },
] as const;

const DEFAULT_FORM: {
  amount: string;
  currency: string;
  description: string;
  settlementAsset: string;
  stellarWalletAddress: string;
  acceptedCurrencies: SupportedCurrency[];
  expiresInHours: number;
} = {
  amount: '',
  currency: 'NGN',
  description: '',
  settlementAsset: 'USDC',
  stellarWalletAddress: '',
  acceptedCurrencies: [...SUPPORTED_CURRENCIES],
  expiresInHours: 24,
};

export function CreateCheckoutLinkDialog({ onCreated }: CreateCheckoutLinkDialogProps) {
  const { user, isAuthenticated, login } = useAuth();
  const stellarAddress = user?.stellarAddress || '';
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (stellarAddress) {
      setFormData((prev) => ({ ...prev, stellarWalletAddress: stellarAddress }));
    }
  }, [stellarAddress]);

  const handleTriggerClick = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createPayment({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        settlementAsset: formData.settlementAsset,
        stellarWalletAddress: formData.stellarWalletAddress || undefined,
        acceptedCurrencies: formData.acceptedCurrencies,
        expiresInHours: formData.expiresInHours,
      });
      setOpen(false);
      setFormData({ ...DEFAULT_FORM, stellarWalletAddress: stellarAddress });
      onCreated();
    } catch {
    } finally {
      setCreating(false);
    }
  };

  const toggleCurrency = (curr: SupportedCurrency) => {
    setFormData((prev) => ({
      ...prev,
      acceptedCurrencies: prev.acceptedCurrencies.includes(curr)
        ? prev.acceptedCurrencies.filter((c) => c !== curr)
        : [...prev.acceptedCurrencies, curr],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button 
        onClick={handleTriggerClick}
        className="w-full bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)] sm:w-auto"
      >
        + New Checkout Link
      </Button>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light italic">
            Create checkout link
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            A hosted payment page, generated in seconds
          </p>
        </DialogHeader>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add Description"
              required
              className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none hover:outline-none border-input"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="amount">
                Amount{' '}
                <span className="text-xs text-muted-foreground">base currency</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="45000"
                required
                className="font-mono focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none hover:outline-none border-input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none hover:outline-none border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="settlement">Settlement asset</Label>
              <Select
                value={formData.settlementAsset}
                onValueChange={(value) => setFormData({ ...formData, settlementAsset: value })}
              >
                <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none hover:outline-none border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SETTLEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expires">Link expiry</Label>
              <Select
                value={formData.expiresInHours.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, expiresInHours: parseInt(value) })
                }
              >
                <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none hover:outline-none border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="stellarWallet">
              Stellar wallet address{' '}
              <span className="text-xs text-muted-foreground">
                (receives payments from customers)
              </span>
            </Label>
            {formData.stellarWalletAddress ? (
              <div className="flex items-center gap-2 border border-input bg-muted/50 px-3 py-2">
                <ShortAddress
                  address={formData.stellarWalletAddress}
                  startChars={8}
                  endChars={8}
                  className="flex-1 text-xs"
                />
              </div>
            ) : (
              <Input
                id="stellarWallet"
                value={formData.stellarWalletAddress}
                onChange={(e) => setFormData({ ...formData, stellarWalletAddress: e.target.value })}
                placeholder="G..."
                className="font-mono text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none hover:outline-none border-input"
              />
            )}
          </div>

          <div className="pt-4">
            <Label className="mb-2 block">
              Accept currencies from customers{' '}
              <span className="text-xs text-muted-foreground">— payer&apos;s local currency</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_CURRENCIES.map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => toggleCurrency(curr)}
                  className={`border px-3 py-1 text-sm font-medium transition-all focus:outline-none ${
                    formData.acceptedCurrencies.includes(curr)
                      ? 'border-[var(--pave-orange)] bg-[var(--pave-orange)] text-white'
                      : 'border-gray-300 bg-card text-muted-foreground hover:border-gray-400 dark:border-gray-700'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="flex-1 bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)] focus:outline-none"
            >
              {creating ? 'Creating...' : 'Generate Checkout Link'}
              {!creating && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-1.5">
                  <path
                    d="M2 7h10M8 3l4 4-4 4"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
