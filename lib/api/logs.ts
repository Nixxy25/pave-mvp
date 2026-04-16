import { getUserData, setUserData } from './helpers';
import type { APILog, HTTPMethod, HTTPStatus } from '@/types';

export async function logAPICall(
  method: string,
  path: string,
  status: number,
  requestBody?: string,
): Promise<void> {
  const logs = await getUserData<APILog[]>('api_logs', []);

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

  logs.unshift(newLog);
  if (logs.length > 100) logs.splice(100);

  await setUserData('api_logs', logs);
}

export async function getAPILogs(): Promise<APILog[]> {
  return getUserData<APILog[]>('api_logs', []);
}
