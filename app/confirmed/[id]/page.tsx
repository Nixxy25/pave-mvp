'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ConfirmedPage() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    const txId = searchParams.get('txId');
    
    setPaymentDetails({
      amount: amount || '192.40',
      currency: currency || 'GHS',
      timestamp: new Date().toISOString(),
      txId: txId || null,
    });
  }, [searchParams]);

  if (!paymentDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[480px] animate-fadeup">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success-light)] ring-4 ring-[var(--success-light)]/50">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path 
                d="M7 13l3 3 7-7" 
                stroke="var(--success)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Success Card */}
        <div className="rounded-[20px] border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="mb-2 font-serif text-[28px] font-light italic text-foreground">
              Payment Successful!
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Your payment has been processed successfully
            </p>
          </div>

          {/* Amount */}
          <div className="mb-6 rounded-lg bg-[var(--success-light)] p-4 text-center">
            <div className="mb-1 text-[13px] font-medium text-[var(--success)]">Amount Paid</div>
            <div className="font-serif text-[32px] font-light italic text-foreground">
              {paymentDetails.currency} {parseFloat(paymentDetails.amount).toLocaleString()}
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-6 space-y-3 border-t pt-4">
            {paymentDetails.txId && (
              <div className="flex justify-between text-[14px]">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-[12px] font-medium text-foreground break-all text-right max-w-[200px]">{paymentDetails.txId}</span>
              </div>
            )}
            <div className="flex justify-between text-[14px]">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">
                {new Date(paymentDetails.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-[var(--success-light)] text-[var(--success)]">
                <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                Completed
              </Badge>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                <circle cx="10" cy="10" r="9" stroke="#3b5bdb" strokeWidth="1.5" />
                <path d="M10 6v5M10 14v.5" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="text-[13px] text-muted-foreground">
                <strong>For Merchants:</strong> This is a test transaction. In production, you'll receive settlement in USDC on the Stellar network.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link href="/dashboard" className="block">
              <Button className="h-11 w-full bg-[var(--pave-orange)] text-[14px] font-medium hover:bg-[var(--pave-orange-hover)]">
                View in Dashboard
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="h-11 w-full text-[14px]"
              onClick={() => window.print()}
            >
              Download Receipt
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
            <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
              <path d="M2 6V4a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <rect x="1" y="5.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            Secured by Pave
          </div>
        </div>
      </div>
    </div>
  );
}
