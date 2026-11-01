'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/fetch-api';
import { ENABLED_INVOICE_CURRENCIES, INVOICE_CURRENCIES } from '@/features/payments/checkout-methods';
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
import { PaymentMethodNotice } from './PaymentMethodNotice';

interface EditCheckoutLinkDialogProps {
  link: CheckoutLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const fieldClassName = 'border-input focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:outline-none';

export function EditCheckoutLinkDialog({ link, open, onOpenChange, onUpdated }: EditCheckoutLinkDialogProps) {
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
  });

  useEffect(() => {
    if (!link) return;
    const title = link.title || link.description;
    setFormData({
      title,
      description: link.title && link.description !== link.title ? link.description : '',
      amount: link.amount.toString(),
      currency: link.currency,
    });
  }, [link]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;
    setUpdating(true);
    try {
      const res = await authFetch(`/api/checkout-links/${link.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          currency: formData.currency,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to update checkout link');
      }
      toast.success('Checkout link updated');
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update checkout link');
    } finally {
      setUpdating(false);
    }
  };

  if (!link) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold">Edit checkout link</DialogTitle>
          <p className="text-sm text-muted-foreground">Update the invoice. The payment method follows the currency.</p>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="edit-title">Payment title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={120}
              className={fieldClassName}
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Description <span className="text-xs text-muted-foreground">optional</span></Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={fieldClassName}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className={`${fieldClassName} font-mono`}
              />
            </div>
            <div>
              <Label htmlFor="edit-currency">Invoice currency</Label>
              <Select value={formData.currency} onValueChange={(currency) => setFormData({ ...formData, currency })}>
                <SelectTrigger id="edit-currency" className={fieldClassName}><SelectValue /></SelectTrigger>
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
          <PaymentMethodNotice currency={formData.currency} />
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={updating} className="flex-1 bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)]">
              {updating ? 'Updating…' : 'Update link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
