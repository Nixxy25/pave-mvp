'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCheckoutLinkById, getMerchantInfo, completeCheckoutPayment } from '@/lib/api';
import { getCurrencyName, SUPPORTED_CURRENCIES, isSupportedCurrency } from '@/lib/constants';
import type { CheckoutLink } from '@/types';

export default function CheckoutPage() {
  const params = useParams();
  const [checkoutData, setCheckoutData] = useState<CheckoutLink | null>(null);
  const [merchantInfo, setMerchantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('GHS');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    loadCheckoutData();
  }, []);

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
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!checkoutData) return;
    if (!customerName.trim()) {
      alert('Please enter your name to continue');
      return;
    }
    setProcessing(true);
    
    const exchangeAmount = checkoutData.equivalents[selectedCurrency] || checkoutData.amount;
    
    setTimeout(async () => {
      try {
        const result = await completeCheckoutPayment({
          checkoutLinkId: checkoutData.id,
          customerName: customerName.trim(),
          amount: exchangeAmount,
          currency: selectedCurrency,
          usdcAmount: checkoutData.equivalents['USD'] || checkoutData.amount,
          description: checkoutData.description,
          paymentMethod: 'card',
        });
        
        window.location.href = `/confirmed/${params.id}?amount=${exchangeAmount}&currency=${selectedCurrency}&txId=${result.paymentId}`;
      } catch (error) {
        alert('Payment failed. Please try again.');
        setProcessing(false);
      }
    }, 2000);
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

  const { amount, currency, description, equivalents } = checkoutData;
  const exchangeAmount = equivalents[selectedCurrency] || amount;

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <nav className="sticky top-0 z-50 flex h-[58px] items-center justify-between border-b bg-card px-4 sm:px-7">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg">
            <div className="h-full w-full" />
          </div>
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
        <div className="w-full max-w-[520px] animate-fadeup rounded-[20px] border bg-card shadow-lg">
          {/* Header */}
          <div className="border-b p-6 pb-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--pave-orange)] to-[#ff8a00] font-serif text-xl font-medium text-white">
                {merchantInfo?.name?.[0] || 'B'}
              </div>
              <div>
                <div className="text-[15px] font-medium text-foreground">{merchantInfo?.name || 'Business'}</div>
                <div className="text-[12.5px] text-muted-foreground">
                  {merchantInfo?.personName || 'Verified merchant'}
                </div>
              </div>
            </div>
            
            <div className="text-[13px] font-medium text-muted-foreground">{description}</div>
            <div className="mt-1.5 font-serif text-[36px] font-light italic leading-none text-foreground">
              {currency} {amount.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">
                ≈ {selectedCurrency} {exchangeAmount.toLocaleString()}
              </span>
              <Badge variant="outline" className="border-[var(--success-medium)] bg-[var(--success-light)] text-[10px] text-[var(--success)]">
                <div className="mr-1 h-1 w-1 animate-blink rounded-full bg-[var(--success)]" />
                live rate
              </Badge>
            </div>
          </div>

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
                className="h-11 w-full rounded-lg border border-gray-300 px-3.5 text-[14px] outline-none transition-all focus:border-[var(--pave-orange)] focus:ring-2 focus:ring-[var(--pave-orange)]/20"
              />
            </div>
            {/* Payment Method — Card only */}
            <div className="mb-5 flex items-center gap-3 rounded-lg border-2 border-[var(--pave-orange)] bg-[var(--pave-orange-light)] p-4">
              <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-[var(--pave-orange)] bg-card">
                <div className="h-full w-full scale-[.6] rounded-full bg-[var(--pave-orange)]" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-medium text-foreground">Debit / Credit Card</div>
                <div className="text-[12px] text-muted-foreground">Visa, Mastercard, Verve</div>
              </div>
              <Badge className="bg-muted text-foreground">Any</Badge>
            </div>

            {/* Currency Selector */}
            <div className="mb-5 flex items-center gap-3 rounded-lg border bg-gray-50 px-4 py-3">
              <span className="text-[13px] text-muted-foreground">Pay in</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="flex-1 cursor-pointer bg-transparent text-[14px] font-medium text-foreground outline-none"
              >
                {Object.keys(equivalents)
                  .filter(curr => isSupportedCurrency(curr) && checkoutData.acceptedCurrencies.includes(curr))
                  .map((curr: string) => (
                  <option key={curr} value={curr}>
                    {curr} — {getCurrencyName(curr)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-6 pt-5">
            <Button
              onClick={handlePayment}
              disabled={processing || !customerName.trim()}
              className="h-12 w-full bg-[var(--pave-orange)] text-[15px] font-medium hover:bg-[var(--pave-orange-hover)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : `Pay ${selectedCurrency} ${exchangeAmount.toLocaleString()}`}
              {!processing && (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="ml-2">
                  <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
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
        </div>
      </div>
    </div>
  );
}
