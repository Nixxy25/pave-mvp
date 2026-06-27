'use client';

import { useState } from 'react';
import { useCheckoutLinks } from '@/hooks/useCheckoutLinks';
import { CreateCheckoutLinkDialog } from './CreateCheckoutLinkDialog';
import { EditCheckoutLinkDialog } from './EditCheckoutLinkDialog';
import { CheckoutLinksTable } from './CheckoutLinksTable';
import type { CheckoutLink } from '@/types';

export default function CheckoutLinksPage() {
  const { links, loading, refetch } = useCheckoutLinks();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<CheckoutLink | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (link: CheckoutLink) => {
    setEditingLink(link);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setTimeout(() => setEditingLink(null), 200);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin border-4 border-gray-200 border-t-[var(--pave-orange)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-7 sm:py-8">
      <div className="mb-6 flex animate-fadeup flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
        <CreateCheckoutLinkDialog onCreated={refetch} />
      </div>

      <CheckoutLinksTable
        links={links}
        loading={loading}
        copiedId={copiedId}
        onCopy={handleCopy}
        onEdit={handleEdit}
      />

      <EditCheckoutLinkDialog
        link={editingLink}
        open={editDialogOpen}
        onOpenChange={handleEditClose}
        onUpdated={refetch}
      />
    </div>
  );
}
