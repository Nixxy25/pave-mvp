'use client';

import { useState } from 'react';
import { createWithdrawal } from '@/lib/api';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useBalance } from '@/hooks/useBalance';
import type { Withdrawal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTableHeader, DataTableLoading, DataTableEmpty, type TableColumn } from '@/components/ui/data-table';

// Withdrawal table columns
const WITHDRAWAL_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'Withdrawal ID' },
  { key: 'amount', label: 'Amount' },
  { key: 'destination', label: 'Destination' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
  { key: 'stellarTx', label: 'Stellar Tx' },
];

export default function WithdrawalsPage() {
  const { withdrawals, loading, refetch: refetchWithdrawals } = useWithdrawals();
  const { balance, refetch: refetchBalance } = useBalance();
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    narration: '',
  });

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
      
      setShowDialog(false);
      setFormData({
        amount: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        narration: '',
      });
      
      await Promise.all([refetchWithdrawals(), refetchBalance()]);
    } catch (error: any) {
      alert(error.message || 'Failed to create withdrawal');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: Withdrawal['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 pb-20 sm:px-7 sm:py-8">
      <div className="mb-6 animate-fadeup flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
            Withdrawals
          </div>
          <h1 className="font-serif text-[24px] font-light italic leading-tight tracking-tight text-foreground sm:text-[27px]">
            Bank Withdrawals
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Move USDC from your Pave wallet to any local bank
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="w-full bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)] sm:w-auto">
              + New Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-light">Withdraw to Bank</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleWithdraw} className="space-y-4 mt-2">
              <div className="rounded-lg border bg-muted p-4">
                <div className="text-xs text-muted-foreground mb-1">Available Balance</div>
                <div className="font-serif text-3xl font-light italic text-foreground">
                  ${balance.usdc.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">≈ ₦{balance.ngn.toLocaleString()}</div>
              </div>
              
              <div>
                <Label htmlFor="amount">Amount (USDC)</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">$</div>
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
              
              <Button type="submit" disabled={creating} className="w-full bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)] h-11 text-[15px] font-medium mt-6">
                {creating ? 'Processing...' : `Withdraw $${formData.amount || '0'} USDC`}
                {!creating && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-2">
                    <path d="M7 1v8M4 6l3 3 3-3M1 11h12" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Withdrawals Table */}
      <div className="rounded-[14px] border bg-card shadow-sm animate-fadeup" style={{ animationDelay: '0.07s' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <DataTableHeader columns={WITHDRAWAL_COLUMNS} />
            <tbody>
              {loading ? (
                <DataTableLoading colSpan={WITHDRAWAL_COLUMNS.length} message="Loading withdrawals..." />
              ) : withdrawals.length === 0 ? (
                <DataTableEmpty 
                  colSpan={WITHDRAWAL_COLUMNS.length} 
                  message="No withdrawals yet. Transfer funds to your bank account to get started."
                />
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {withdrawal.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      ${withdrawal.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">{withdrawal.destination.bankName}</div>
                      <div className="text-xs text-muted-foreground">{withdrawal.destination.accountNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(withdrawal.status)}>
                        {withdrawal.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {withdrawal.stellarTxHash ? (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${withdrawal.stellarTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--pave-orange)] hover:underline"
                        >
                          View →
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
