'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Check, Link2, Plus, Wallet } from 'lucide-react';
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
  currency: 'USD',
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

  const fieldLabel =
    'mb-2 block font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground';
  const selectedCount = formData.acceptedCurrencies.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={handleTriggerClick}
        className="group h-auto w-full gap-2 rounded-full bg-foreground px-5 py-2.5 text-[13.5px] text-background shadow-lg transition-all hover:bg-[var(--pave-orange)] hover:text-white hover:shadow-[0_10px_30px_-8px_rgba(208,82,0,0.6)] sm:w-auto"
      >
        <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
        New checkout link
      </Button>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-[560px] gap-0 overflow-y-auto">
        <DialogHeader className="mb-6 flex-row items-center gap-4 text-left">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--pave-orange)] text-white shadow-[0_10px_24px_-10px_rgba(208,82,0,0.8)]">
            <Link2 className="size-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-serif text-[24px] font-light italic leading-tight">
              Create checkout link
            </DialogTitle>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              A hosted payment page, generated in seconds.
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <Label htmlFor="description" className={fieldLabel}>
              Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Design retainer, Hoodie order"
              required
            />
          </div>

          <div>
            <Label htmlFor="amount" className={fieldLabel}>
              Amount
            </Label>
            <div className="flex gap-2">
              <Input
                id="amount"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="settlement" className={fieldLabel}>
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
              <Label htmlFor="expires" className={fieldLabel}>
                Link expiry
              </Label>
              <Select
                value={formData.expiresInHours.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, expiresInHours: parseInt(value) })
                }
              >
                <SelectTrigger className="w-full">
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
            <Label htmlFor="stellarWallet" className={fieldLabel}>
              Receiving wallet
            </Label>
            {formData.stellarWalletAddress ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--pave-orange-light)] text-[var(--pave-orange)]">
                  <Wallet className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <ShortAddress
                    address={formData.stellarWalletAddress}
                    startChars={8}
                    endChars={8}
                    className="text-[12.5px]"
                  />
                  <div className="text-[11.5px] text-muted-foreground">
                    Stellar · receives customer payments
                  </div>
                </div>
              </div>
            ) : (
              <Input
                id="stellarWallet"
                value={formData.stellarWalletAddress}
                onChange={(e) => setFormData({ ...formData, stellarWalletAddress: e.target.value })}
                placeholder="G..."
                className="font-mono text-xs"
              />
            )}
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <Label className="font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Customers can pay in
              </Label>
              <span className="font-mono text-[11px] text-muted-foreground">
                {selectedCount} selected
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
              onClick={() => setOpen(false)}
              className="h-12 flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="group h-12 flex-[1.6] rounded-full bg-foreground text-background shadow-lg transition-all hover:bg-[var(--pave-orange)] hover:text-white hover:shadow-[0_10px_30px_-8px_rgba(208,82,0,0.6)]"
            >
              {creating ? 'Creating…' : 'Generate checkout link'}
              {!creating && (
                <ArrowRight className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
