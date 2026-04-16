'use client';

import { useState } from 'react';
import { createPayment } from '@/lib/api';
import { useCheckoutLinks } from '@/hooks/useCheckoutLinks';
import { SUPPORTED_CURRENCIES } from '@/lib/constants';
import type { CheckoutLink } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTableHeader, DataTableLoading, DataTableEmpty, type TableColumn } from '@/components/ui/data-table';

const CHECKOUT_LINK_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'Link ID' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'url', label: 'Checkout URL' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];

export default function CheckoutLinksPage() {
  const { links, loading, refetch } = useCheckoutLinks();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'NGN',
    description: '',
    settlementAsset: 'USDC',
    acceptedCurrencies: [...SUPPORTED_CURRENCIES],
    expiresInHours: 24,
    redirectUrl: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      await createPayment({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        settlementAsset: formData.settlementAsset,
        acceptedCurrencies: formData.acceptedCurrencies,
        expiresInHours: formData.expiresInHours,
        redirectUrl: formData.redirectUrl || undefined,
      });
      
      setShowCreateDialog(false);
      setFormData({
        amount: '',
        currency: 'NGN',
        description: '',
        settlementAsset: 'USDC',
        acceptedCurrencies: [...SUPPORTED_CURRENCIES],
        expiresInHours: 24,
        redirectUrl: '',
      });
      
      await refetch();
    } catch (error) {
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCheckoutUrl = (linkId: string) => {
    return `${window.location.origin}/checkout/${linkId}`;
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 pb-20 sm:px-7 sm:py-8">
      <div className="mb-6 animate-fadeup flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
            Checkout Links
          </div>
          <h1 className="font-serif text-[24px] font-light italic leading-tight tracking-tight text-foreground sm:text-[27px]">
            Payment Links
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Create shareable links to collect payments
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)] sm:w-auto">
              + New Checkout Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-light italic">Create checkout link</DialogTitle>
              <p className="text-sm text-muted-foreground">A hosted payment page, generated in seconds</p>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
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
                  <Label htmlFor="amount">Amount <span className="text-xs text-muted-foreground">base currency</span></Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="45000"
                    required
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="GHS">GHS</SelectItem>
                      <SelectItem value="ZAR">ZAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="XOF">XOF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="settlement">Settlement asset</Label>
                  <Select value={formData.settlementAsset} onValueChange={(value) => setFormData({ ...formData, settlementAsset: value })}>
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
                  <Select value={formData.expiresInHours.toString()} onValueChange={(value) => setFormData({ ...formData, expiresInHours: parseInt(value) })}>
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
                <Label htmlFor="redirectUrl">Redirect after payment <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  value={formData.redirectUrl}
                  onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                  placeholder="https://yourwebsite.com/success"
                />
              </div>
              
              <div className="border-t pt-4">
                <Label className="mb-2 block">Accept currencies from customers <span className="text-xs text-muted-foreground">— payer's local currency</span></Label>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => {
                        const newCurrencies = formData.acceptedCurrencies.includes(curr)
                          ? formData.acceptedCurrencies.filter(c => c !== curr)
                          : [...formData.acceptedCurrencies, curr];
                        setFormData({ ...formData, acceptedCurrencies: newCurrencies });
                      }}
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
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="flex-1 bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)]">
                  {creating ? 'Creating...' : 'Generate Checkout Link'}
                  {!creating && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-1.5">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Links Table */}
      <div className="rounded-[14px] border bg-card shadow-sm animate-fadeup" style={{ animationDelay: '0.07s' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <DataTableHeader columns={CHECKOUT_LINK_COLUMNS} />
            <tbody>
              {loading ? (
                <DataTableLoading colSpan={CHECKOUT_LINK_COLUMNS.length} message="Loading checkout links..." />
              ) : links.length === 0 ? (
                <DataTableEmpty 
                  colSpan={CHECKOUT_LINK_COLUMNS.length} 
                  message="No checkout links yet. Create your first one to get started."
                />
              ) : (
                links.map((link) => {
                  const checkoutUrl = getCheckoutUrl(link.id);
                  return (
                    <tr key={link.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {link.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {link.description}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {link.currency} {link.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="max-w-[280px] truncate rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                            {checkoutUrl}
                          </code>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={link.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}>
                          {link.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(checkoutUrl, link.id)}
                          className="text-[var(--pave-orange)] hover:bg-orange-50"
                        >
                          {copiedId === link.id ? '✓ Copied' : 'Copy Link'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
