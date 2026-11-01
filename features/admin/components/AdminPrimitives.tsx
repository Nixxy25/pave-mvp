import Link from 'next/link';
import { CircleHelp } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AdminPageHeader({
  eyebrow = 'Internal operations',
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-xs font-medium text-text-muted">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminMetric({
  label,
  value,
  detail,
  icon,
  placeholder = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
  placeholder?: boolean;
}) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-0">
        <CardTitle className="text-sm font-medium text-text-secondary">{label}</CardTitle>
        <span className="text-text-muted [&_svg]:size-4 [&_svg]:stroke-[1.75]">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight tabular-nums text-text-primary">{value}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
          {placeholder && <CircleHelp aria-hidden="true" className="size-3.5 stroke-[1.75]" />}
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

export function AdminSectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b py-4">
        <div>
          <CardTitle className="text-base font-semibold text-text-primary">{title}</CardTitle>
          {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
        </div>
        {action}
      </CardHeader>
      {children}
    </Card>
  );
}

export function AdminEmptyState({ message }: { message: string }) {
  return <div className="px-4 py-12 text-center text-sm text-muted-foreground">{message}</div>;
}

export function AdminErrorState({ section }: { section: string }) {
  return (
    <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      Could not load {section}. Refresh the page or contact the Pave engineering team if the problem persists.
    </div>
  );
}

export function AdminStatus({ status }: { status: string | null }) {
  const value = status?.toLowerCase() ?? 'unknown';
  return <StatusBadge status={value} tone={value === 'confirming' ? 'pending' : undefined} />;
}

export function AdminReadOnlyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function AdminPagination({
  page,
  totalPages,
  total,
  basePath,
  search,
  status,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  search?: string;
  status?: string;
}) {
  const href = (target: number) => {
    const query = new URLSearchParams();
    query.set('page', String(target));
    if (search) query.set('q', search);
    if (status) query.set('status', status);
    return `${basePath}?${query.toString()}`;
  };
  const start = total === 0 ? 0 : (page - 1) * 25 + 1;
  const end = Math.min(page * 25, total);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">Showing {start}–{end} of {total}</p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>Previous</Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page - 1)}>Previous</Link>
          </Button>
        )}
        <span aria-live="polite" className="px-2 text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>Next</Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page + 1)}>Next</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatAmount(amount: number | string | null, currency: string | null): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return '—';
  return `${Number(amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency ?? ''}`.trim();
}

export function ShortReference({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-text-muted">—</span>;
  return (
    <span title={value} className="font-mono text-xs text-text-secondary">
      {value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value}
    </span>
  );
}

export function TransactionTable({
  rows,
}: {
  rows: Array<{
    id: string;
    merchant_id: string;
    merchant_name?: string;
    merchant?: { name: string; email: string } | null;
    payer_name: string | null;
    amount: number | string;
    currency: string;
    paid_with: string | null;
    method: string | null;
    status: string | null;
    stellar_tx_hash: string | null;
    created_at: string | null;
  }>;
}) {
  if (!rows.length) return <AdminEmptyState message="No transactions match these filters." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Payment</TableHead>
          <TableHead>Merchant</TableHead>
          <TableHead>Customer reference</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Stellar reference</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link className="font-mono text-xs text-[var(--pave-orange)] hover:underline" href={`/admin/transactions/${row.id}`}>
                {row.id.slice(0, 8)}…
              </Link>
            </TableCell>
            <TableCell>
              <div className="max-w-40 truncate font-medium text-text-primary">{row.merchant?.name ?? row.merchant_name ?? 'Merchant unavailable'}</div>
              <div className="max-w-40 truncate text-xs text-muted-foreground">{row.merchant?.email ?? row.merchant_id}</div>
            </TableCell>
            <TableCell>{row.payer_name || 'Guest payer'}</TableCell>
            <TableCell className="font-medium tabular-nums text-text-primary">{formatAmount(row.amount, row.currency)}</TableCell>
            <TableCell>{row.method || row.paid_with || '—'}</TableCell>
            <TableCell><AdminStatus status={row.status} /></TableCell>
            <TableCell><ShortReference value={row.stellar_tx_hash} /></TableCell>
            <TableCell className="text-text-muted">{formatAdminDate(row.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
