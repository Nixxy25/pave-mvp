'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, Pencil, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CryptoPay } from './CryptoPay';
import { PaystackPay } from './PaystackPay';
import { OrderSummary, type CheckoutStep } from './CheckoutHeader';
import { PaymentMethodSelector, type PaymentMethod } from './PaymentMethodSelector';
import { getCheckoutLinkById, getMerchantInfo, completeCheckoutPayment } from '@/lib/api';
import { useExchangeRates, convertCurrency } from '@/hooks/useExchangeRates';
import type { CheckoutLink } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutPage() {
  const params = useParams();
  const { data: exchangeRates } = useExchangeRates();
  const [checkoutData, setCheckoutData] = useState<CheckoutLink | null>(null);
  const [merchantInfo, setMerchantInfo] = useState<{ name: string; personName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stellar');
  const [hasPaystack, setHasPaystack] = useState(false);
  const [returning, setReturning] = useState<null | { reference: string; state: 'verifying' | 'pending' | 'failed'; msg?: string }>(null);

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
        }
      } catch {
        // Silently fail - checkout might not exist
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [params.id]);

  useEffect(() => {
    fetch('/api/paystack/initialize')
      .then((r) => r.json())
      .then((j) => setHasPaystack(Boolean(j.enabled)))
      .catch(() => {});
  }, []);

  // Back from Paystack's hosted page: confirm the payment server-side, then show the receipt.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('reference');
    if (!ref) return;
    const checkoutId = params.id as string;
    let cancelled = false;
    let tries = 0;
    setReturning({ reference: ref, state: 'verifying' });

    const attempt = async () => {
      try {
        const result = await completeCheckoutPayment({
          checkoutLinkId: checkoutId,
          paymentMethod: 'paystack',
          paystackReference: ref,
        });
        if (!cancelled) window.location.replace(`/confirmed/${result.paymentId}`);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : '';
        // Bank transfers / mobile money can take a moment to confirm: keep checking.
        if (msg.includes('not been completed') && tries < 36) {
          tries += 1;
          setReturning({ reference: ref, state: 'pending' });
          setTimeout(attempt, 5000);
        } else {
          setReturning({ reference: ref, state: 'failed', msg });
        }
      }
    };
    attempt();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleStellarSuccess = async (txHash: string) => {
    if (!checkoutData) return;
    try {
      const result = await completeCheckoutPayment({
        checkoutLinkId: checkoutData.id,
        customerName: customerName.trim() || 'Stellar User',
        customerEmail: customerEmail.trim() || undefined,
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

  if (returning) {
    const failed = returning.state === 'failed';
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf7] px-4 dark:bg-background">
        <div className="w-full max-w-[440px] rounded-3xl border border-border/60 bg-card p-9 text-center shadow-[0_40px_80px_-30px_rgba(0,0,0,.25)]">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--pave-orange-light)] text-[var(--pave-orange)]">
            {failed ? <Lock className="size-6" /> : <Loader2 className="size-6 animate-spin" />}
          </span>
          <h1 className="mt-5 font-serif text-[26px] font-light italic text-foreground">
            {failed ? 'We couldn’t confirm your payment' : returning.state === 'pending' ? 'Waiting for your bank…' : 'Confirming your payment…'}
          </h1>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            {failed
              ? returning.msg || 'Something went wrong. If money left your account, contact the merchant with this reference.'
              : 'This only takes a moment. Please keep this page open.'}
          </p>
          <div className="mt-4 font-mono text-[11px] text-muted-foreground">Ref: {returning.reference}</div>
          {failed && (
            <a
              href={`/checkout/${params.id as string}`}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[14px] font-medium text-background transition-colors hover:bg-[var(--pave-orange)] hover:text-white"
            >
              Back to checkout
            </a>
          )}
        </div>
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

  const xlmAmount = exchangeRates ? convertCurrency(amount, currency, 'XLM', exchangeRates) : amount;

  const equivalents = exchangeRates
    ? (checkoutData.acceptedCurrencies || [])
        .filter((c) => c !== currency && ['USD', 'GHS', 'KES'].includes(c))
        .slice(0, 2)
        .map((code) => ({ code, value: convertCurrency(amount, currency, code, exchangeRates) }))
    : [];

  const hasStellarOption = Boolean(checkoutData.stellarWalletAddress);
  const nameValid = customerName.trim().length > 1;
  const emailValid = EMAIL_RE.test(customerEmail.trim());

  const submitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!nameValid || !emailValid) return;
    setStep('method');
  };

  const chooseMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep('pay');
  };

  const slide = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  };

  const fieldLabel =
    'mb-2 block font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground';
  const fieldBase =
    'h-12 w-full rounded-xl border bg-muted/40 pl-11 pr-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-card focus:ring-4';

  return (
    <div className="min-h-screen bg-[#fafaf7] dark:bg-background">
      {/* Topbar */}
      <nav className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[var(--pave-orange)]" />
          <span className="font-serif text-[21px] font-medium tracking-tight text-foreground">Pave Checkout</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-[12px] text-muted-foreground">
          <Lock className="size-3" />
          Secured by Pave
        </div>
      </nav>

      <div className="flex justify-center px-4 py-8 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid w-full max-w-[980px] overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,.04),0_40px_80px_-30px_rgba(0,0,0,.25)] md:grid-cols-[360px_1fr]"
        >
          <OrderSummary
            merchantName={merchantInfo?.name}
            currency={currency}
            amount={amount}
            description={description}
            step={step}
            equivalents={equivalents}
          />

          <div className="flex min-h-[460px] flex-col p-6 sm:p-9">
            <AnimatePresence mode="wait" initial={false}>
              {step === 'details' && (
                <motion.form key="details" {...slide} onSubmit={submitDetails} noValidate className="flex flex-1 flex-col">
                  <h1 className="font-serif text-[28px] font-light italic leading-tight text-foreground">
                    Let&apos;s start with you
                  </h1>
                  <p className="mt-1 text-[13.5px] text-muted-foreground">
                    We&apos;ll send your receipt here. It takes ten seconds.
                  </p>

                  <div className="mt-7 space-y-5">
                    <div>
                      <label htmlFor="cust-name" className={fieldLabel}>Full name</label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="cust-name"
                          type="text"
                          autoComplete="name"
                          autoFocus
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ama Mensah"
                          aria-invalid={touched && !nameValid}
                          className={`${fieldBase} ${
                            touched && !nameValid
                              ? 'border-red-500 focus:ring-red-500/15'
                              : 'border-border/70 focus:border-[var(--pave-orange)] focus:ring-[var(--pave-orange)]/15'
                          }`}
                        />
                      </div>
                      {touched && !nameValid && (
                        <p className="mt-1.5 text-[12px] text-red-500">Please enter your name.</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="cust-email" className={fieldLabel}>Email address</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="cust-email"
                          type="email"
                          autoComplete="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="you@example.com"
                          aria-invalid={touched && !emailValid}
                          className={`${fieldBase} ${
                            touched && !emailValid
                              ? 'border-red-500 focus:ring-red-500/15'
                              : 'border-border/70 focus:border-[var(--pave-orange)] focus:ring-[var(--pave-orange)]/15'
                          }`}
                        />
                      </div>
                      {touched && !emailValid && (
                        <p className="mt-1.5 text-[12px] text-red-500">Enter a valid email address.</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="group mt-auto h-12 w-full rounded-full bg-foreground text-[15px] text-background shadow-lg transition-all hover:bg-[var(--pave-orange)] hover:text-white hover:shadow-[0_10px_30px_-8px_rgba(208,82,0,0.6)]"
                  >
                    Continue
                    <ArrowRight className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                  <p className="mt-4 text-center text-[11.5px] text-muted-foreground">
                    Your details are only shared with {merchantInfo?.name || 'the merchant'}.
                  </p>
                </motion.form>
              )}

              {step === 'method' && (
                <motion.div key="method" {...slide} className="flex flex-1 flex-col">
                  <h1 className="font-serif text-[28px] font-light italic leading-tight text-foreground">
                    How would you like to pay?
                  </h1>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="group mt-2 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="max-w-[220px] truncate">
                      {customerName.trim()} · {customerEmail.trim()}
                    </span>
                    <Pencil className="size-3 transition-transform group-hover:rotate-12" />
                  </button>

                  <div className="mt-7">
                    <PaymentMethodSelector
                      hasStellarOption={hasStellarOption}
                      hasPaystack={hasPaystack}
                      xlmAmount={exchangeRates ? xlmAmount : undefined}
                      onSelect={chooseMethod}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="mt-auto inline-flex w-fit cursor-pointer items-center gap-1.5 pt-8 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" /> Back
                  </button>
                </motion.div>
              )}

              {step === 'pay' && (
                <motion.div key="pay" {...slide} className="flex flex-1 flex-col">
                  <h1 className="font-serif text-[28px] font-light italic leading-tight text-foreground">
                    {paymentMethod === 'stellar' ? 'Send stablecoins' : paymentMethod === 'card' ? 'Pay by card' : 'Pay by transfer'}
                  </h1>
                  <p className="mt-1 text-[13.5px] text-muted-foreground">
                    Paying as <span className="font-medium text-foreground">{customerName.trim()}</span>
                  </p>

                  <div className="mt-6">
                    {paymentMethod === 'stellar' && checkoutData.stellarWalletAddress ? (
                      exchangeRates ? (
                        <CryptoPay
                          merchantAddress={checkoutData.stellarWalletAddress}
                          xlmAmount={xlmAmount}
                          onSuccess={handleStellarSuccess}
                          onError={handleStellarError}
                          disabled={!nameValid}
                        />
                      ) : (
                        <div className="rounded-2xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                          Loading live rates…
                        </div>
                      )
                    ) : (
                      <PaystackPay
                        mode={paymentMethod === 'card' ? 'card' : 'transfer'}
                        checkoutLinkId={checkoutData.id}
                        customerName={customerName.trim()}
                        customerEmail={customerEmail.trim()}
                        baseCurrency={currency}
                        baseAmount={amount}
                        acceptedCurrencies={checkoutData.acceptedCurrencies || []}
                        rates={exchangeRates}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('method')}
                    className="mt-auto inline-flex w-fit cursor-pointer items-center gap-1.5 pt-8 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" /> Change payment method
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
