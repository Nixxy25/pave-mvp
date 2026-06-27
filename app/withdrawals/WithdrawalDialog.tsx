'use client';

// ──────────────────────────────────────────────────────────────────────────────
// WITHDRAWALS FEATURE: COMING SOON
// This component is disabled until the withdrawal feature is ready for launch
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { createWithdrawal } from '@/lib/api';
import type { BalanceData } from '@/types';
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

interface WithdrawalDialogProps {
  balance: BalanceData;
  onSuccess: () => Promise<void> | void;
}

const EMPTY_FORM = {
  amount: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  narration: '',
};

export function WithdrawalDialog({ balance, onSuccess }: WithdrawalDialogProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createWithdrawal({
        amount: parseFloat(formData.amount),
        currency: 'USDC',
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        narration: formData.narration,
      });
      setOpen(false);
      setFormData(EMPTY_FORM);
      await onSuccess();
    } catch (error: any) {
      alert(error.message || 'Failed to create withdrawal');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)] sm:w-auto">
          + New Withdrawal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light">Withdraw to Bank</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleWithdraw} className="mt-2 space-y-4">
          <div className="border bg-muted p-4">
            <div className="mb-1 text-xs text-muted-foreground">Available Balance</div>
            <div className="font-serif text-3xl font-light italic text-foreground">
              ${balance.usdc.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">≈ ₦{balance.ngn.toLocaleString()}</div>
          </div>

          <div>
            <Label htmlFor="amount">Amount (USDC)</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  $
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="100.00"
                  required
                  className="pl-7 font-mono text-base"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="GTBank Nigeria"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="0123456789"
              required
              className="mt-1.5 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="John Doe"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="narration">Narration (optional)</Label>
            <Input
              id="narration"
              value={formData.narration}
              onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
              placeholder="Payment for services"
              className="mt-1.5"
            />
          </div>

          <Button
            type="submit"
            disabled={creating}
            className="mt-6 h-11 w-full bg-[var(--pave-orange)] text-[15px] font-medium hover:bg-[var(--pave-orange-hover)]"
          >
            {creating ? 'Processing...' : `Withdraw $${formData.amount || '0'} USDC`}
            {!creating && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-2">
                <path
                  d="M7 1v8M4 6l3 3 3-3M1 11h12"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
