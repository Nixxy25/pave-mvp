'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useExchangeRates, convertCurrency } from '@/hooks/useExchangeRates';
import { API_ENDPOINTS } from '@/lib/constants';

interface PaymentDetails {
  id: string;
  amount: number;
  currency: string;
  usdcAmount: number;
  status: string;
  method: string;
  stellarTxHash: string | null;
  createdAt: string;
  description?: string;
}

export default function ConfirmedPage() {
  const params = useParams();
  const { data: exchangeRates } = useExchangeRates();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const paymentId = params.id as string;
        const response = await fetch(`/api/payments/${paymentId}/confirm`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment not found or not completed');
        }
        
        const data = await response.json();
        setPaymentDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPaymentDetails();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading payment details...</div>
      </div>
    );
  }

  if (error || !paymentDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-[480px] text-center">
          <div className="mb-4 text-[18px] font-medium text-foreground">Payment Not Found</div>
          <p className="mb-6 text-[14px] text-muted-foreground">
            {error || 'This payment could not be found or has not been completed yet.'}
          </p>
          <Link href="/dashboard">
            <Button className="bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)]">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[480px] animate-fadeup">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center bg-[var(--success-light)] ring-4 ring-[var(--success-light)]/50">
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
        <div className="border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="mb-2 font-serif text-[28px] font-light italic text-foreground">
              Payment Successful!
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Your payment has been processed successfully
            </p>
          </div>

          {/* Amount */}
          <div className="mb-6 bg-[var(--success-light)] p-4 text-center">
            <div className="mb-1 text-[13px] font-medium text-[var(--success)]">Amount Paid</div>
            <div className="font-serif text-[32px] font-light italic text-foreground">
              {paymentDetails.method === 'Stellar Wallet' && exchangeRates ? (
                // For Stellar Wallet payments, show XLM amount calculated from USDC using live rate
                <>XLM {convertCurrency(paymentDetails.usdcAmount, 'USD', 'XLM', exchangeRates).toFixed(2)}</>
              ) : (
                // For other payment methods, show stored amount in original currency
                <>{paymentDetails.currency} {paymentDetails.amount.toLocaleString()}</>
              )}
            </div>
            {exchangeRates && paymentDetails.method !== 'Stellar Wallet' && paymentDetails.currency !== 'USD' && (
              <div className="mt-2 text-[13px] text-muted-foreground">
                ≈ ${paymentDetails.usdcAmount.toLocaleString()} USD
                {' · '}
                {convertCurrency(paymentDetails.usdcAmount, 'USD', 'XLM', exchangeRates).toFixed(2)} XLM
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="mb-6 space-y-3 border-t pt-4">
            <div className="flex justify-between text-[14px]">
              <span className="text-muted-foreground">Settlement Amount</span>
              <span className="font-mono text-[13px] font-medium text-[var(--success)]">
                USDC {paymentDetails.usdcAmount.toLocaleString()}
              </span>
            </div>
            {paymentDetails.stellarTxHash && (
              <div className="flex justify-between text-[14px]">
                <span className="text-muted-foreground">
                  {paymentDetails.method === 'Stellar Wallet' ? 'Stellar TX Hash' : 'Transaction ID'}
                </span>
                {paymentDetails.method === 'Stellar Wallet' ? (
                  <a
                    href={`${API_ENDPOINTS.STELLAR_EXPLORER_TESTNET}/tx/${paymentDetails.stellarTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[12px] font-medium text-[var(--stellar)] underline whitespace-nowrap"
                  >
                    {paymentDetails.stellarTxHash.slice(0, 8)}…{paymentDetails.stellarTxHash.slice(-6)}
                  </a>
                ) : (
                  <span className="font-mono text-[12px] font-medium text-foreground underline whitespace-nowrap">
                    {paymentDetails.stellarTxHash}
                  </span>
                )}
              </div>
            )}
            <div className="flex justify-between text-[14px]">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">
                {new Date(paymentDetails.createdAt).toLocaleDateString('en-US', {
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
                <div className="mr-1.5 h-1.5 w-1.5 bg-[var(--success)]" />
                Completed
              </Badge>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                <circle cx="10" cy="10" r="9" stroke="#3b5bdb" strokeWidth="1.5" />
                <path d="M10 6v5M10 14v.5" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="text-[13px] text-muted-foreground">
                <strong>For Merchants:</strong> This is a test transaction. In production, you&apos;ll receive settlement in USDC on the Stellar network.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="h-11 w-full text-[14px]"
              onClick={() => window.print()}
            >
              Download Receipt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
