export const INVOICE_CURRENCIES = ['USD', 'NGN', 'GHS', 'KES'] as const;
export type InvoiceCurrency = (typeof INVOICE_CURRENCIES)[number];

// Only USD can be invoiced until local bank rails exist; the others stay visible but disabled.
export const ENABLED_INVOICE_CURRENCIES: readonly InvoiceCurrency[] = ['USD'];

export function isEnabledInvoiceCurrency(value: string): value is InvoiceCurrency {
  return (ENABLED_INVOICE_CURRENCIES as readonly string[]).includes(value);
}

export function isInvoiceCurrency(value: string): value is InvoiceCurrency {
  return isEnabledInvoiceCurrency(value);
}

export function paymentMethodsForCurrency(currency: string): Array<'crypto' | 'bank_transfer'> {
  return currency === 'USD' ? ['crypto'] : ['bank_transfer'];
}
