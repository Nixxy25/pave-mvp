'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StellarPayment } from './StellarPayment';
import { CheckoutHeader } from './CheckoutHeader';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CurrencySelector } from './CurrencySelector';
import { getCheckoutLinkById, getMerchantInfo, completeCheckoutPayment } from '@/lib/api';
import { isSupportedCurrency } from '@/lib/constants';
import { useExchangeRates, convertCurrency } from '@/hooks/useExchangeRates';
import type { CheckoutLink } from '@/types';

type PaymentMethod = 'card' | 'stellar';

export default function CheckoutPage() {
  const params = useParams();
  const { data: exchangeRates } = useExchangeRates();
  const [checkoutData, setCheckoutData] = useState<CheckoutLink | null>(null);
  const [merchantInfo, setMerchantInfo] = useState<{ name: string; personName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('GHS');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        const checkoutId = params.id as string;
        const link = await getCheckoutLinkById(checkoutId);
        
        if (link) {
          setCheckoutData(link);
          
          const merchant = await getMerchantInfo(checkoutId);
          if (merchant) {
            setMerchantInfo(merchant);
          }
          
          const acceptedCurrencies = link.acceptedCurrencies || [];
          const availableCurrencies = acceptedCurrencies.filter(isSupportedCurrency);
          if (availableCurrencies.length > 0) {
            setSelectedCurrency(availableCurrencies[0]);
          } else if (link.equivalents) {
            const currencyKeys = Object.keys(link.equivalents).filter(isSupportedCurrency);
            if (currencyKeys.length > 0) {
              setSelectedCurrency(currencyKeys[0]);
            }
          }
        }
      } catch {
        // Silently fail - checkout might not exist
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [params.id]);

  const handleCardPayment = async () => {
    if (!checkoutData) return;
    if (!customerName.trim()) {
      toast.error('Please enter your name to continue');
      return;
    }
    
    // This is disabled but keeping the handler for potential future use
    try {
      const result = await completeCheckoutPayment({
          checkoutLinkId: checkoutData.id,
          customerName: customerName.trim(),
          paymentMethod: 'card',
        });
        
        // Redirect to secure confirmation page (server fetches payment details)
        window.location.href = `/confirmed/${result.paymentId}`;
      } catch {
        toast.error('Payment failed. Please try again.');
      }
  };

  const handleStellarSuccess = async (txHash: string) => {
    if (!checkoutData) return;
    try {
      const result = await completeCheckoutPayment({
        checkoutLinkId: checkoutData.id,
        customerName: customerName.trim() || 'Stellar User',
        paymentMethod: 'stellar',
        stellarTxHash: txHash,
      });
      // Redirect to secure confirmation page (server fetches payment details)
      window.location.href = `/confirmed/${result.paymentId}`;
    } catch {
      toast.error('Payment sent but record failed. TX: ' + txHash);
    }
  };

  const handleStellarError = (msg: string) => {
    toast.error(`Stellar payment failed: ${msg}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
        <div className="text-muted-foreground">Loading checkout...</div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
        <div className="text-center">
          <h1 className="mb-2 font-serif text-2xl text-foreground">Checkout not found</h1>
          <p className="text-muted-foreground">This checkout link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  // Check if checkout link is completed or expired
  if (checkoutData.status === 'completed' || checkoutData.status === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-[520px] border bg-card p-8 text-center shadow-lg">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center bg-muted">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-muted-foreground">
                <path d="M8 16V12a8 8 0 0116 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <rect x="4" y="14" width="24" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 font-serif text-2xl font-light italic text-foreground">
            {checkoutData.status === 'completed' ? 'Payment Completed' : 'Link Expired'}
          </h1>
          <p className="text-muted-foreground">
            {checkoutData.status === 'completed'
              ? 'This checkout link has already been used and is no longer active.'
              : 'This checkout link has expired and can no longer be used for payment.'}
          </p>
        </div>
      </div>
    );
  }

  const { amount, currency, description } = checkoutData;
  
  // Calculate live exchange amounts using React Query
  const exchangeAmount = exchangeRates 
    ? convertCurrency(amount, currency, selectedCurrency, exchangeRates)
    : amount;

  const xlmAmount = exchangeRates
    ? convertCurrency(amount, currency, 'XLM', exchangeRates)
    : amount;

  const hasStellarOption = Boolean(checkoutData.stellarWalletAddress);

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <nav className="sticky top-0 z-50 flex h-[58px] items-center justify-between border-b bg-card px-4 sm:px-7">
        <div className="flex items-center gap-2.5">
          <span className="font-serif text-[21px] font-medium tracking-tight text-foreground">
            Pave Checkout
          </span>
        </div>
        <div className="hidden items-center gap-2 text-[12px] text-muted-foreground sm:flex">
          <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
            <path d="M2 6V4a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <rect x="1" y="5.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          Secured by Pave
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[520px] animate-fadeup border bg-card shadow-lg">
          <CheckoutHeader
            merchantInfo={merchantInfo}
            currency={currency}
            amount={amount}
            description={description}
            paymentMethod={paymentMethod}
            selectedCurrency={selectedCurrency}
            exchangeAmount={exchangeAmount}
            xlmAmount={xlmAmount}
          />

          {/* Body */}
          <div className="p-6">
            {/* Customer name */}
            <div className="mb-5">
              <label className="mb-1.5 block text-[13px] font-medium text-foreground">Your name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="h-11 w-full border border-gray-300 px-3.5 text-[14px] outline-none transition-all focus:border-[var(--pave-orange)] focus:ring-2 focus:ring-[var(--pave-orange)]/20"
              />
            </div>

            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              hasStellarOption={hasStellarOption}
            />

            {paymentMethod === 'card' && exchangeRates && (
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                equivalents={{
                  USD: convertCurrency(amount, currency, 'USD', exchangeRates),
                  NGN: convertCurrency(amount, currency, 'NGN', exchangeRates),
                  GHS: convertCurrency(amount, currency, 'GHS', exchangeRates),
                  KES: convertCurrency(amount, currency, 'KES', exchangeRates),
                  XLM: convertCurrency(amount, currency, 'XLM', exchangeRates),
                }}
                acceptedCurrencies={checkoutData.acceptedCurrencies}
              />
            )}

            {paymentMethod === 'card' && !exchangeRates && (
              <div className="border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                Loading exchange rates...
              </div>
            )}

            {/* Stellar Payment */}
            {paymentMethod === 'stellar' && checkoutData.stellarWalletAddress && (
              <div className="mb-1">
                {exchangeRates ? (
                  <StellarPayment
                    merchantAddress={checkoutData.stellarWalletAddress}
                    xlmAmount={xlmAmount}
                    onSuccess={handleStellarSuccess}
                    onError={handleStellarError}
                    disabled={!customerName.trim()}
                  />
                ) : (
                  <div className="border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                    Loading exchange rates...
                  </div>
                )}
                {!customerName.trim() && exchangeRates && (
                  <p className="mt-2 text-center text-[12px] text-muted-foreground">
                    Enter your name above to enable payment
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer — card pay button */}
          {paymentMethod === 'card' && (
            <div className="border-t p-6 pt-5">
              <Button
                onClick={handleCardPayment}
                disabled={true}
                className="h-12 w-full bg-muted text-[15px] font-medium text-muted-foreground cursor-not-allowed opacity-70"
              >
                Coming Soon
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className="ml-2">
                  <path d="M1 5.5V3.5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <rect x=".5" y="5" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </Button>

              <div className="mt-4 flex items-center justify-center gap-4 text-[11.5px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                    <path d="M1 5.5V3.5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <rect x=".5" y="5" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  Secured
                </div>
                <span className="text-gray-200">·</span>
                <div className="text-muted-foreground">Settles in ~5s</div>
                <span className="text-gray-200">·</span>
                <div className="text-[var(--stellar)]">Stellar network</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
