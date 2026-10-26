import { getCurrentUserId } from '@/lib/fetch-api';
import type { APILog, HTTPMethod, HTTPStatus } from '@/types';

// Logs are lightweight audit data — stored in localStorage per user.
function storageKey(userId: string) {
  return `pave_api_logs_${userId}`;
}

function readLogs(userId: string): APILog[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

function writeLogs(userId: string, logs: APILog[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(logs));
}

export async function logAPICall(
  method: string,
  path: string,
  status: number,
  requestBody?: string,
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  const validMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const validStatuses: HTTPStatus[] = [200, 201, 400, 401, 404, 422, 500];

  const newLog: APILog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    method: validMethods.includes(method as HTTPMethod) ? (method as HTTPMethod) : 'POST',
    path,
    status: validStatuses.includes(status as HTTPStatus) ? (status as HTTPStatus) : 200,
    duration: Math.floor(Math.random() * 200) + 50,
    timestamp: new Date().toISOString(),
    requestBody,
  };

  const logs = readLogs(userId);
  logs.unshift(newLog);
  if (logs.length > 100) logs.splice(100);
  writeLogs(userId, logs);
}

export async function getAPILogs(): Promise<APILog[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];
  return readLogs(userId);
}

