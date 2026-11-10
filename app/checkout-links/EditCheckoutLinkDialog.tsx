'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, Pencil } from 'lucide-react';
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
  { value: 'KES', label: 'KES' },
  { value: 'GHS', label: 'GHS' },
  { value: 'USD', label: 'USD' },
] as const;

const SETTLEMENT_OPTIONS = [
  { value: 'USDC', label: 'USDC (Stellar)' },
  { value: 'XLM', label: 'XLM' },
] as const;


export function EditCheckoutLinkDialog({ link, open, onOpenChange, onUpdated }: EditCheckoutLinkDialogProps) {
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
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

  const fieldLabel =
    'mb-2 block font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-[560px] gap-0 overflow-y-auto">
        <DialogHeader className="mb-6 flex-row items-center gap-4 text-left">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--pave-orange)] text-white shadow-[0_10px_24px_-10px_rgba(208,82,0,0.8)]">
            <Pencil className="size-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-serif text-[24px] font-light italic leading-tight">
              Edit checkout link
            </DialogTitle>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Update your payment link details.
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <Label htmlFor="edit-description" className={fieldLabel}>
              Description
            </Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Design retainer, Hoodie order"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-amount" className={fieldLabel}>
              Amount
            </Label>
            <div className="flex gap-2">
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                className="flex-1 font-mono text-[17px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="w-28 font-mono">
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
            <Label htmlFor="edit-settlement" className={fieldLabel}>
              Settle in
            </Label>
            <Select
              value={formData.settlementAsset}
              onValueChange={(value) => setFormData({ ...formData, settlementAsset: value })}
            >
              <SelectTrigger className="w-full">
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
            <div className="mb-2 flex items-baseline justify-between">
              <Label className="font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Customers can pay in
              </Label>
              <span className="font-mono text-[11px] text-muted-foreground">
                {formData.acceptedCurrencies.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_CURRENCIES.map((curr) => {
                const on = formData.acceptedCurrencies.includes(curr);
                return (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => toggleCurrency(curr)}
                    aria-pressed={on}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 font-mono text-[13px] font-medium outline-none transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-[var(--pave-orange)]/15 ${
                      on
                        ? 'border-[var(--pave-orange)] bg-[var(--pave-orange-light)] text-[var(--pave-orange)]'
                        : 'border-border/70 bg-muted/40 text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <Check className={`size-3.5 transition-all ${on ? 'scale-100 opacity-100' : 'w-0 scale-0 opacity-0'}`} />
                    {curr}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2.5 pt-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updating}
              className="group h-12 flex-[1.6] rounded-full bg-foreground text-background shadow-lg transition-all hover:bg-[var(--pave-orange)] hover:text-white hover:shadow-[0_10px_30px_-8px_rgba(208,82,0,0.6)]"
            >
              {updating ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
