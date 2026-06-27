'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DataTableHeader,
  DataTableLoading,
  DataTableEmpty,
  type TableColumn,
} from '@/components/ui/data-table';
import type { CheckoutLink } from '@/types';

const COLUMNS: TableColumn[] = [
  { key: 'id', label: 'Link ID' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'url', label: 'Checkout URL' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];

interface CheckoutLinksTableProps {
  links: CheckoutLink[];
  loading: boolean;
  copiedId: string | null;
  onCopy: (url: string, id: string) => void;
}

export function CheckoutLinksTable({ links, loading, copiedId, onCopy }: CheckoutLinksTableProps) {
  const getCheckoutUrl = (linkId: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/${linkId}`;

  return (
    <div
      className="border bg-card shadow-sm animate-fadeup"
      style={{ animationDelay: '0.07s' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <DataTableHeader columns={COLUMNS} />
          <tbody>
            {loading ? (
              <DataTableLoading colSpan={COLUMNS.length} message="Loading checkout links..." />
            ) : links.length === 0 ? (
              <DataTableEmpty
                colSpan={COLUMNS.length}
                message="No checkout links yet. Create your first one to get started."
              />
            ) : (
              links.map((link) => {
                const checkoutUrl = getCheckoutUrl(link.id);
                return (
                  <tr key={link.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {link.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="max-w-[200px] truncate">{link.description}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                      {link.currency} {link.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <code className="max-w-[280px] truncate rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                        {checkoutUrl}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          link.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {link.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCopy(checkoutUrl, link.id)}
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
  );
}
