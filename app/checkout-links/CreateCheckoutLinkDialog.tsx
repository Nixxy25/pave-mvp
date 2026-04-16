'use client';

import { useState, useEffect } from 'react';
import { createPayment } from '@/lib/api';
import { useWallet } from '@/contexts/WalletContext';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  const { address: walletAddress } = useWallet();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (walletAddress) {
      setFormData((prev) => ({ ...prev, stellarWalletAddress: walletAddress }));
    }
  }, [walletAddress]);

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
      setFormData({ ...DEFAULT_FORM, stellarWalletAddress: walletAddress || '' });
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
      <DialogTrigger asChild>
        <Button className="w-full bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)] sm:w-auto">
          + New Checkout Link
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[50vw] max-w-[50vw]">
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
              placeholder="Pro Plan — November"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                className="font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                  <SelectItem value="GHS">GHS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="settlement">Settlement asset</Label>
              <Select
                value={formData.settlementAsset}
                onValueChange={(value) => setFormData({ ...formData, settlementAsset: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC (Stellar)</SelectItem>
                  <SelectItem value="XLM">XLM</SelectItem>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                  <SelectItem value="0">No expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="stellarWallet">
              Stellar wallet address{' '}
              <span className="text-xs text-muted-foreground">
                (optional — for display on checkout)
              </span>
            </Label>
            <Input
              id="stellarWallet"
              value={formData.stellarWalletAddress}
              onChange={(e) => setFormData({ ...formData, stellarWalletAddress: e.target.value })}
              placeholder="G..."
              className="font-mono text-xs"
            />
          </div>

          <div className="border-t pt-4">
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
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition-all ${
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

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="flex-1 bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)]"
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
