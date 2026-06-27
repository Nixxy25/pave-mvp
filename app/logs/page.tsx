'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAPILogs } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { DataTableHeader, DataTableLoading, DataTableEmpty, type TableColumn } from '@/components/ui/data-table';
import type { APILog } from '@/types';

const LOG_COLUMNS: TableColumn[] = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'method', label: 'Method' },
  { key: 'path', label: 'Path' },
  { key: 'status', label: 'Status' },
  { key: 'duration', label: 'Duration' },
  { key: 'requestBody', label: 'Request Body' },
];

export default function LogsPage() {
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<APILog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchLogs = async () => {
      setLoading(true);
      const data = await getAPILogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, [isAuthenticated]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (status >= 500) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-muted text-muted-foreground';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'POST':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'PUT':
      case 'PATCH':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'DELETE':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin border-4 border-gray-200 border-t-[var(--pave-orange)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 pb-20 sm:px-7 sm:py-8">
      <div className="mb-6 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          API Logs
        </div>
        <h1 className="font-serif text-[24px] font-light italic leading-tight tracking-tight text-foreground sm:text-[27px]">
          Request Logs
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Every API request and webhook delivery in real time
        </p>
      </div>

      {/* Logs Table */}
      <div className="border bg-card shadow-sm animate-fadeup" style={{ animationDelay: '0.07s' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <DataTableHeader columns={LOG_COLUMNS} />
            <tbody>
              {loading ? (
                <DataTableLoading colSpan={LOG_COLUMNS.length} message="Loading logs..." />
              ) : logs.length === 0 ? (
                <DataTableEmpty 
                  colSpan={LOG_COLUMNS.length} 
                  message="No API requests yet. Start using the API to see logs here."
                />
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getMethodColor(log.method)}>
                        {log.method}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {log.path}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {log.duration}ms
                    </td>
                    <td className="px-4 py-3">
                      {log.requestBody ? (
                        <details className="cursor-pointer">
                          <summary className="text-xs text-[var(--pave-orange)] hover:underline">
                            View body
                          </summary>
                          <pre className="mt-2 max-w-md overflow-x-auto rounded bg-gray-900 p-2 text-xs text-gray-100">
                            {log.requestBody}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
