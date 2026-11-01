'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Check, Coins, Copy, Landmark, Lock, ShieldCheck } from 'lucide-react';
import { PaveLogo } from '@/components/brand/PaveLogo';
import { StellarTxLink } from '@/components/StellarTxLink';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckoutApiError,
  createCheckoutPaymentSession,
  getCheckoutInfo,
  getCheckoutConfirmation,
  getCheckoutPaymentSession,
  getCheckoutQuote,
  type CheckoutInfo,
  type CheckoutPaymentSession,
  type CheckoutPaymentStatus,
} from '@/features/customer/api/checkout';
import { paymentMethodsForCurrency } from '@/features/payments/checkout-methods';

function sessionStorageKey(checkoutLinkId: string) {
  return `pave.checkout.session.${checkoutLinkId}`;
}

function rememberSession(checkoutLinkId: string, sessionId: string | null) {
  try {
    const key = sessionStorageKey(checkoutLinkId);
    if (sessionId) sessionStorage.setItem(key, sessionId);
    else sessionStorage.removeItem(key);
  } catch {
    // Storage can be blocked. The in-memory session still works for this visit.
  }
}

function rememberedSession(checkoutLinkId: string): string | null {
  try {
    return sessionStorage.getItem(sessionStorageKey(checkoutLinkId));
  } catch {
    return null;
  }
}

function useStoredSession(checkoutLinkId: string) {
  return useSyncExternalStore(
    () => () => {},
    () => rememberedSession(checkoutLinkId) ?? '',
    () => '',
  );
}

const ACTIVE_PAYMENT_STATUSES: CheckoutPaymentStatus[] = [
  'awaiting_payment',
  'payment_detected',
  'verifying',
];

function formatAmount(amount: number | string): string {
  const value = Number(amount);
  return (Number.isFinite(value) ? value : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatInvoiceAmount(amount: number | string, currency: string): string {
  return `${currency} ${formatAmount(amount)}`;
}

function getErrorMessage(error: unknown): string {
  const fallback = 'Checkout is temporarily unavailable. Please try again shortly.';
  if (!(error instanceof CheckoutApiError) || error.status >= 500) return fallback;
  if (error.code === 'PAYMENT_SESSIONS_UNAVAILABLE' || error.code === 'PAYMENT_MONITOR_UNHEALTHY') return fallback;
  if (/testnet checkout|payment monitoring|no payment session/i.test(error.message)) return fallback;
  return error.message;
}

function StatusLabel({ status }: { status: CheckoutPaymentStatus }) {
  const labels: Record<CheckoutPaymentStatus, string> = {
    awaiting_payment: 'Waiting for payment',
    payment_detected: 'Payment detected',
    verifying: 'Confirming payment',
    completed: 'Payment completed',
    expired: 'Payment expired',
    payment_issue: 'Payment issue',
  };
  const colors: Record<CheckoutPaymentStatus, string> = {
    awaiting_payment: 'bg-status-pending-bg text-status-pending',
    payment_detected: 'bg-status-info-bg text-status-info',
    verifying: 'bg-status-info-bg text-status-info',
    completed: 'bg-status-success-bg text-status-success',
    expired: 'bg-status-expired-bg text-status-expired',
    payment_issue: 'bg-status-failed-bg text-status-failed',
  };
  return (
    <span className={`inline-flex items-center gap-2 rounded-none border border-current/20 px-3 py-1.5 text-sm font-medium ${colors[status]}`} role="status" aria-live="polite">
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const copy = async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error(`[checkout] Could not copy ${label.toLowerCase()}:`, error);
      setCopyError(true);
    }
  };

  return (
    <span className="text-right">
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="inline-flex items-center gap-1.5 rounded-none border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-[var(--pave-orange)] hover:text-[var(--pave-orange)]"
      >
        {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {copyError && <p role="alert" className="text-xs text-destructive">Select and copy instead.</p>}
    </span>
  );
}

function PaymentMethodTabs() {
  return (
    <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Payment method">
      <button
        type="button"
        role="tab"
        aria-selected="true"
        className="flex items-center justify-center gap-2 rounded-none border border-[var(--pave-orange)] bg-[var(--pave-orange)] px-3 py-3 text-sm font-semibold text-white"
      >
        <Coins aria-hidden="true" className="size-4" /> Crypto Transfer
      </button>
      <button
        type="button"
        role="tab"
        aria-selected="false"
        aria-disabled="true"
        disabled
        title="Local bank transfer is coming soon"
        className="flex cursor-not-allowed items-center justify-center gap-2 rounded-none border border-border bg-muted px-3 py-3 text-sm font-medium text-muted-foreground"
      >
        <Lock aria-hidden="true" className="size-4" /> Local Bank Transfer
        <span className="text-[10px] uppercase tracking-wide">Coming soon</span>
      </button>
      <p className="col-span-2 text-xs text-muted-foreground">Pay with crypto or local bank transfer. Bank transfer is not available yet.</p>
    </div>
  );
}

function CompletedPanel({
  amount,
  assetCode,
  merchantName,
  transactionHash,
  network,
}: {
  amount: string;
  assetCode: string;
  merchantName: string;
  transactionHash: string | null | undefined;
  network?: string | null;
}) {
  return (
    <div className="animate-fadeup border border-status-success/40 bg-status-success-bg px-4 py-10 text-center" role="status">
      <span className="animate-pop mx-auto flex size-14 items-center justify-center rounded-none bg-status-success text-white">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path className="animate-draw" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">Payment completed</h2>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{amount} {assetCode}</p>
      <p className="mt-1 text-sm text-muted-foreground">Paid to {merchantName}</p>
      {transactionHash && (
        <p className="mt-5 text-xs text-muted-foreground">
          Transaction <StellarTxLink hash={transactionHash} network={network} />
        </p>
      )}
      <p className="mt-5 text-xs text-muted-foreground">This checkout is closed. It cannot be paid again.</p>
    </div>
  );
}

function useCountdown(expiresAt: string) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const expiry = new Date(expiresAt).getTime();
    const update = () => setRemainingMs(Number.isFinite(expiry) ? Math.max(0, expiry - Date.now()) : 0);
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const remaining = remainingMs ?? 0;
  const totalSeconds = Math.ceil(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    ready: remainingMs !== null,
    expired: remainingMs !== null && remaining <= 0,
    label: remainingMs === null
      ? 'Checking…'
      : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
}

function PaymentInstructions({
  session,
  sessionId,
  merchantName,
  title,
  description,
  statusError,
  onTryAgain,
}: {
  session: CheckoutPaymentSession;
  sessionId: string;
  merchantName: string;
  title: string;
  description: string;
  statusError: boolean;
  onTryAgain: () => void;
}) {
  const countdown = useCountdown(session.expiresAt);
  const currentSession = session;
  const expired = currentSession.status === 'expired' || countdown.expired;
  const status = expired ? 'expired' : currentSession.status;
  const waiting = countdown.ready && status === 'awaiting_payment';
  const verifying = status === 'payment_detected' || status === 'verifying';
  const confirmationQuery = useQuery({
    queryKey: ['checkout-confirmation', sessionId],
    queryFn: () => getCheckoutConfirmation(sessionId),
    enabled: status === 'completed',
    retry: 3,
    refetchInterval: (query) => (query.state.data ? false : 3_000),
  });

  const row = 'border-b border-border px-4 py-4 last:border-b-0';
  const rowLabel = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';
  return (
    <div className="space-y-5">
      <CheckoutHeader
        merchantName={merchantName}
        title={title}
        description={description}
        amountLine={formatInvoiceAmount(session.invoiceAmount, session.invoiceCurrency)}
      />

      {status === 'completed' ? (
        <CompletedPanel
          amount={formatAmount(session.amount)}
          assetCode={session.assetCode}
          merchantName={merchantName}
          transactionHash={confirmationQuery.data?.transactionHash}
          network={confirmationQuery.data?.network ?? session.network}
        />
      ) : verifying ? (
        <div className="border border-border bg-muted px-4 py-8 text-center" role="status">
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-border border-t-[var(--pave-orange)]" />
          <p className="mt-3 text-sm font-semibold text-foreground">Confirming payment</p>
          <p className="mt-1 text-xs text-muted-foreground">Pave is verifying your transaction on the network. Please don&apos;t send another payment.</p>
        </div>
      ) : waiting && currentSession.destinationAddress ? (
        <div className="border border-border bg-card">
          <div className={row}>
            <div className="flex items-center justify-between gap-3">
              <span className={rowLabel}>Network</span>
              <span className="text-sm font-medium text-foreground">Stellar</span>
            </div>
          </div>
          <div className={row}>
            <div className="flex items-center justify-between gap-3">
              <span className={rowLabel}>Expires in</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">{countdown.label}</span>
            </div>
          </div>
          <div className={row}>
            <div className="flex items-center justify-between gap-3">
              <span className={rowLabel}>Recipient address</span>
              <CopyButton label="wallet address" value={currentSession.destinationAddress} />
            </div>
            <p className="mt-2 break-all font-mono text-sm text-foreground">{currentSession.destinationAddress}</p>
          </div>
          {currentSession.memo && (
            <div className={row}>
              <div className="flex items-center justify-between gap-3">
                <span className={rowLabel}>Memo (required)</span>
                <CopyButton label="memo" value={currentSession.memo} />
              </div>
              <p className="mt-2 break-all font-mono text-sm text-foreground">{currentSession.memo}</p>
              <p className="mt-1 text-xs text-muted-foreground">Include this memo when sending your payment.</p>
            </div>
          )}
          <div className={row}>
            <div className="flex items-center justify-between gap-3">
              <span className={rowLabel}>Exact amount</span>
              <CopyButton label="amount" value={String(session.amount)} />
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">{formatAmount(session.amount)} {session.assetCode}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatAmount(session.invoiceAmount)} {session.invoiceCurrency} ≈ {formatAmount(session.amount)} {session.assetCode} · fixed 1:1 rate
            </p>
          </div>
        </div>
      ) : (
        <div role="alert" className="border border-border bg-muted p-4 text-sm text-muted-foreground">
          {expired
            ? 'This payment has expired. Start again to get a new address.'
            : countdown.ready
              ? 'Payment details are not available right now.'
              : 'Checking this payment…'}
        </div>
      )}

      {statusError && !expired && (
        <div role="alert" className="border border-status-pending/40 bg-status-pending-bg p-3 text-sm text-status-pending">
          Payment status could not be refreshed. Please try again shortly.
        </div>
      )}

      {status !== 'completed' && !verifying && <StatusLabel status={status} />}

      {(expired || status === 'payment_issue') && (
        <Button type="button" onClick={onTryAgain} className="h-12 w-full rounded-none bg-[var(--pave-orange)] hover:bg-[var(--pave-orange-hover)]">
          Try again <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

function CheckoutHeader({
  merchantName,
  title,
  description,
  amountLine,
  verified,
}: {
  merchantName: string;
  title: string;
  description: string;
  amountLine: string;
  verified?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">Payment to {merchantName}</p>
          {verified && (
            <span className="inline-flex items-center gap-1 border border-status-success/40 bg-status-success-bg px-2 py-0.5 text-xs text-status-success">
              <ShieldCheck aria-hidden="true" className="size-3.5" /> Verified
            </span>
          )}
        </div>
        {title && <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{title}</h1>}
        {description && description !== title && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-baseline justify-between border-y border-border py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invoice amount</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">{amountLine}</span>
      </div>
    </div>
  );
}

function InvoiceDetails({
  invoice,
  quote,
}: {
  invoice: CheckoutInfo;
  quote: { usdcAmount: number; expiresAt: string } | null;
}) {
  const cryptoAvailable = paymentMethodsForCurrency(invoice.currency).includes('crypto');
  const estimate = quote?.usdcAmount;
  return (
    <div className="space-y-5">
      <CheckoutHeader
        merchantName={invoice.merchantName}
        title={invoice.title}
        description={invoice.description}
        amountLine={formatInvoiceAmount(invoice.amount, invoice.currency)}
        verified={invoice.merchantVerified}
      />
      {cryptoAvailable ? (
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Network</span>
            <span className="text-sm font-medium text-foreground">Stellar</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">You pay</span>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {estimate != null ? `${formatAmount(estimate)} USDC` : 'Loading amount…'}
            </span>
          </div>
          {estimate != null && (
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              {formatAmount(invoice.amount)} {invoice.currency} ≈ {formatAmount(estimate)} USDC · fixed 1:1 rate
            </p>
          )}
        </div>
      ) : (
        <div role="status" className="border border-border bg-muted p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-foreground"><Landmark aria-hidden="true" className="size-4" /> Bank transfer — Coming soon</p>
          <p className="mt-1 text-muted-foreground">Bank transfer is not available yet, so this invoice cannot be paid.</p>
        </div>
      )}
    </div>
  );
}

export function CheckoutExperience({
  checkoutLinkId,
  initialSessionId,
}: {
  checkoutLinkId: string;
  initialSessionId: string | null;
}) {
  const router = useRouter();
  const storedSession = useStoredSession(checkoutLinkId);
  const sessionIdRef = useRef<string | null>(initialSessionId);
  const [sessionOverride, setSessionOverride] = useState<string | null | undefined>(initialSessionId ?? undefined);
  const sessionId = sessionOverride !== undefined ? sessionOverride : (storedSession || null);
  const [sessionFromCreate, setSessionFromCreate] = useState<CheckoutPaymentSession | null>(null);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  const invoiceQuery = useQuery({
    queryKey: ['public-checkout', checkoutLinkId],
    queryFn: () => getCheckoutInfo(checkoutLinkId),
    enabled: Boolean(checkoutLinkId),
    retry: false,
    refetchInterval: false,
  });
  const quoteQuery = useQuery({
    queryKey: ['checkout-quote', checkoutLinkId],
    queryFn: () => getCheckoutQuote(checkoutLinkId),
    enabled: Boolean(checkoutLinkId) && !sessionId && invoiceQuery.data?.currency === 'USD',
    retry: false,
    refetchInterval: 30_000,
  });

  const createSession = useMutation({
    mutationFn: (idempotencyKey: string) => createCheckoutPaymentSession(checkoutLinkId, idempotencyKey),
    onSuccess: (session) => {
      sessionIdRef.current = session.id;
      setSessionFromCreate(session);
      setSessionOverride(session.id);
      setSessionLoadError(null);
      rememberSession(checkoutLinkId, session.id);
      router.replace(`/checkout/${encodeURIComponent(checkoutLinkId)}`, { scroll: false });
    },
    onError: (error) => setSessionLoadError(getErrorMessage(error)),
  });

  const sessionQuery = useQuery({
    queryKey: ['checkout-payment-session', sessionId, checkoutLinkId],
    queryFn: () => getCheckoutPaymentSession(sessionId!, checkoutLinkId),
    enabled: Boolean(sessionId),
    retry: false,
    staleTime: 0,
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const status = query.state.data?.status;
      return status && !ACTIVE_PAYMENT_STATUSES.includes(status) ? false : 2_000;
    },
  });

  useEffect(() => {
    if (!initialSessionId) return;
    rememberSession(checkoutLinkId, initialSessionId);
    router.replace(`/checkout/${encodeURIComponent(checkoutLinkId)}`, { scroll: false });
  }, [checkoutLinkId, initialSessionId, router]);

  const returnToInvoice = () => {
    sessionIdRef.current = null;
    setSessionOverride(null);
    setSessionFromCreate(null);
    setSessionLoadError(null);
    rememberSession(checkoutLinkId, null);
    router.replace(`/checkout/${encodeURIComponent(checkoutLinkId)}`, { scroll: false });
  };
  const tryAgain = () => {
    returnToInvoice();
    createSession.mutate(crypto.randomUUID());
  };

  if (invoiceQuery.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="size-8 animate-spin rounded-full border-4 border-border border-t-[var(--pave-orange)]" role="status" aria-label="Loading secure checkout" />
      </main>
    );
  }
  if (invoiceQuery.isError || !invoiceQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-none border border-border bg-card p-6 text-center sm:p-8">
          <AlertCircle aria-hidden="true" className="mx-auto h-8 w-8 text-destructive" />
          <h1 className="mt-4 font-sans text-2xl font-semibold">Checkout unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{getErrorMessage(invoiceQuery.error)}</p>
        </div>
      </main>
    );
  }

  const invoice = invoiceQuery.data;
  const existingSession = sessionQuery.data ?? sessionFromCreate;
  const cryptoAvailable = paymentMethodsForCurrency(invoice.currency).includes('crypto');

  return (
    <main className="min-h-screen bg-muted">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-12">
        <Card className="rounded-none border border-border bg-card py-0 shadow-none">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <PaveLogo size={24} />
              <ThemeToggle />
            </div>

            {invoice.status === 'active' && existingSession?.status !== 'completed' && <PaymentMethodTabs />}

            {existingSession ? (
              <PaymentInstructions
                session={existingSession}
                sessionId={existingSession.id}
                merchantName={invoice.merchantName}
                title={invoice.title}
                description={invoice.description}
                statusError={sessionQuery.isError}
                onTryAgain={tryAgain}
              />
            ) : sessionId && sessionQuery.isError ? (
              <div className="space-y-4 text-center">
                <AlertCircle aria-hidden="true" className="mx-auto size-8 text-status-pending" />
                <h2 className="font-sans text-2xl font-semibold">Session could not be restored</h2>
                <p role="alert" className="text-sm text-muted-foreground">
                  {sessionLoadError || getErrorMessage(sessionQuery.error)}
                </p>
                <Button type="button" variant="outline" onClick={tryAgain} className="rounded-none">Try again</Button>
              </div>
            ) : sessionId && sessionQuery.isPending ? (
              <div className="flex justify-center py-10" role="status" aria-label="Restoring your payment session">
                <div className="size-8 animate-spin rounded-full border-4 border-border border-t-[var(--pave-orange)]" />
              </div>
            ) : invoice.status === 'completed' ? (
              <div className="space-y-5">
                <CheckoutHeader
                  merchantName={invoice.merchantName}
                  title={invoice.title}
                  description={invoice.description}
                  amountLine={formatInvoiceAmount(invoice.amount, invoice.currency)}
                  verified={invoice.merchantVerified}
                />
                <CompletedPanel
                  amount={invoice.completion ? formatAmount(invoice.completion.amount) : formatAmount(invoice.amount)}
                  assetCode={invoice.completion?.assetCode ?? 'USDC'}
                  merchantName={invoice.merchantName}
                  transactionHash={invoice.completion?.transactionHash}
                  network={invoice.completion?.network}
                />
              </div>
            ) : invoice.status !== 'active' ? (
              <div className="space-y-3 text-center">
                <h2 className="font-sans text-2xl font-semibold">Invoice expired</h2>
                <p className="text-sm text-muted-foreground">This checkout link has expired and cannot be paid.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <InvoiceDetails invoice={invoice} quote={quoteQuery.data ?? null} />
                {sessionLoadError && <p role="alert" className="border border-status-pending/40 bg-status-pending-bg p-3 text-sm text-status-pending">{sessionLoadError}</p>}
                {!cryptoAvailable ? (
                  <Button type="button" disabled className="h-12 w-full rounded-none">Bank transfer — Coming soon</Button>
                ) : createSession.isPending ? (
                  <Button type="button" disabled className="h-12 w-full rounded-none bg-[var(--pave-orange)]">
                    Creating secure payment session…
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => createSession.mutate(sessionIdRef.current ?? (sessionIdRef.current = crypto.randomUUID()))}
                    className="h-12 w-full rounded-none bg-[var(--pave-orange)] text-base font-medium hover:bg-[var(--pave-orange-hover)]"
                  >
                    Continue to payment <ArrowRight aria-hidden="true" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
