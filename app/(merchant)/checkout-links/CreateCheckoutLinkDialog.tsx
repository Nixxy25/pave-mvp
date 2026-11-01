'use client';

import { useState } from 'react';
import { createPayment } from '@/features/merchant/api/checkout-links';
import { ENABLED_INVOICE_CURRENCIES, INVOICE_CURRENCIES } from '@/features/payments/checkout-methods';
import { useAuth } from '@/features/merchant/auth/AuthContext';
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
import { PaymentMethodNotice } from './PaymentMethodNotice';

interface CreateCheckoutLinkDialogProps {
  onCreated: () => void;
}

const EXPIRY_OPTIONS = [
  { value: '24', label: '24 hours' },
  { value: '48', label: '48 hours' },
  { value: '168', label: '7 days' },
  { value: '0', label: 'No expiry' },
] as const;

const DEFAULT_FORM = {
  title: '',
  description: '',
  amount: '',
  currency: 'USD',
  expiresInHours: 24,
};

const fieldClassName = 'border-input focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:outline-none';

export function CreateCheckoutLinkDialog({ onCreated }: CreateCheckoutLinkDialogProps) {
  const { isAuthenticated, login } = useAuth();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

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
    setError(null);
    try {
      await createPayment({
        title: formData.title.trim(),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        expiresInHours: formData.expiresInHours,
      });
      setOpen(false);
      setFormData(DEFAULT_FORM);
      onCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The checkout link could not be created.');
    } finally {
      setCreating(false);
    }
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
          <DialogTitle className="font-sans text-xl font-semibold">Create checkout link</DialogTitle>
          <p className="text-sm text-muted-foreground">A hosted payment page, generated in seconds</p>
        </DialogHeader>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="title">Payment title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Invoice or product name"
              required
              maxLength={120}
              className={fieldClassName}
            />
          </div>

          <div>
            <Label htmlFor="description">Description <span className="text-xs text-muted-foreground">optional</span></Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a short note for the customer"
              className={fieldClassName}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="50.00"
                required
                className={`${fieldClassName} font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
            </div>
            <div>
              <Label htmlFor="currency">Invoice currency</Label>
              <Select value={formData.currency} onValueChange={(currency) => setFormData({ ...formData, currency })}>
                <SelectTrigger id="currency" className={fieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency} disabled={!ENABLED_INVOICE_CURRENCIES.includes(currency)}>
                      {currency}{ENABLED_INVOICE_CURRENCIES.includes(currency) ? '' : ' — Coming soon'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="expires">Expiration</Label>
            <Select
              value={formData.expiresInHours.toString()}
              onValueChange={(value) => setFormData({ ...formData, expiresInHours: parseInt(value, 10) })}
            >
              <SelectTrigger id="expires" className={fieldClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <PaymentMethodNotice currency={formData.currency} />

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={creating} className="flex-1 bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)]">
              {creating ? 'Creating…' : 'Generate Checkout Link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
