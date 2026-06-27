'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/fetch-api';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@/lib/constants';
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
import type { CheckoutLink } from '@/types';

interface EditCheckoutLinkDialogProps {
  link: CheckoutLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
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

const inputClassName = "focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none hover:outline-none border-input";
const selectClassName = "focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none hover:outline-none border-input";

export function EditCheckoutLinkDialog({ link, open, onOpenChange, onUpdated }: EditCheckoutLinkDialogProps) {
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'NGN',
    description: '',
    settlementAsset: 'USDC',
    acceptedCurrencies: [...SUPPORTED_CURRENCIES] as SupportedCurrency[],
  });

  // Load existing link data into form
  useEffect(() => {
    if (link) {
      setFormData({
        amount: link.amount.toString(),
        currency: link.currency,
        description: link.description || '',
        settlementAsset: link.settlementAsset || 'USDC',
        acceptedCurrencies: (link.acceptedCurrencies || [...SUPPORTED_CURRENCIES]) as SupportedCurrency[],
      });
    }
  }, [link]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    setUpdating(true);
    try {
      const res = await authFetch(`/api/checkout-links/${link.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          description: formData.description,
          settlementAsset: formData.settlementAsset,
          acceptedCurrencies: formData.acceptedCurrencies,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to update checkout link');
      }

      toast.success('Checkout link updated successfully');
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update checkout link');
    } finally {
      setUpdating(false);
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

  if (!link) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light italic">
            Edit checkout link
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Update your payment link details
          </p>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add Description"
              required
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-amount">
                Amount{' '}
                <span className="text-xs text-muted-foreground">base currency</span>
              </Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="45000"
                required
                className={`${inputClassName} font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
            </div>
            <div>
              <Label htmlFor="edit-currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className={selectClassName}>
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

          <div>
            <Label htmlFor="edit-settlement">Settlement asset</Label>
            <Select
              value={formData.settlementAsset}
              onValueChange={(value) => setFormData({ ...formData, settlementAsset: value })}
            >
              <SelectTrigger className={selectClassName}>
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
              onClick={() => onOpenChange(false)}
              className="flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updating}
              className="flex-1 bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)] focus:outline-none"
            >
              {updating ? 'Updating...' : 'Update Link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
