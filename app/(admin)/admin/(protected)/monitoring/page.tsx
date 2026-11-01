import { AdminPageHeader, AdminReadOnlyNotice, AdminSectionCard, AdminEmptyState, formatAdminDate } from '@/features/admin/components/AdminPrimitives';
import { getWebhookHealth } from '@/features/admin/server/payment-engine';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';

const STOPPED_AFTER_MS = 2 * 60 * 1000;

type Health = NonNullable<Awaited<ReturnType<typeof getWebhookHealth>> extends infer R ? R extends { status: 'ok'; data: infer D } ? D : never : never>[number];

function streamState(h: Health): 'stopped' | 'failures' | 'healthy' {
  if (!h.lastReceivedAt || Date.now() - new Date(h.lastReceivedAt).getTime() > STOPPED_AFTER_MS) return 'stopped';
  if (h.lastFailedAt && (!h.lastProcessedAt || h.lastFailedAt > h.lastProcessedAt)) return 'failures';
  return 'healthy';
}

export const dynamic = 'force-dynamic';

export default async function AdminMonitoringPage() {
  const health = await getWebhookHealth();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="System monitoring"
        description="QuickNode webhook deliveries are the only payment detector. Figures come from recorded deliveries; nothing is assumed."
      />
      <AdminReadOnlyNotice>
        A failed delivery is retried by QuickNode. Stopped means no delivery for over 2 minutes: the stream is paused, terminated or cannot reach the app.
      </AdminReadOnlyNotice>
      <AdminSectionCard title="QuickNode webhook">
        {health.status === 'ok' && health.data.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network</TableHead><TableHead>Status</TableHead><TableHead>Last delivery</TableHead>
                  <TableHead>Last processed</TableHead><TableHead>Deliveries (24h)</TableHead><TableHead>Failed (24h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {health.data.map((h) => (
                  <TableRow key={h.network}>
                    <TableCell>{h.network}</TableCell>
                    <TableCell>{(() => {
                      const state = streamState(h);
                      if (state === 'stopped') return <StatusBadge status="stopped" tone="pending" label="Stopped" />;
                      if (state === 'failures') return <StatusBadge status="failed" tone="expired" label="Failures" />;
                      return <StatusBadge status="ok" tone="success" label="Healthy" />;
                    })()}</TableCell>
                    <TableCell>{formatAdminDate(h.lastReceivedAt)}</TableCell>
                    <TableCell>{formatAdminDate(h.lastProcessedAt)}</TableCell>
                    <TableCell>{h.received24h}</TableCell>
                    <TableCell>{h.failed24h}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <AdminEmptyState message={health.status === 'ok' ? 'No QuickNode deliveries have been received yet.' : 'Not configured: the schema is not deployed in this environment.'} />
        )}
      </AdminSectionCard>
    </section>
  );
}
