export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type HTTPStatus = 200 | 201 | 400 | 401 | 404 | 422 | 500;

export interface APILog {
  id: string;
  timestamp: string;
  method: HTTPMethod;
  path: string;
  endpoint?: string;
  status: HTTPStatus;
  duration: number;
  requestId?: string;
  requestBody?: string;
}

export interface WebhookEvent {
  id: string;
  type: 'payment.settled' | 'payment.failed' | 'payout.settled' | 'payout.failed';
  created: number;
  data: any;
  delivered: boolean;
  deliveredAt?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  success: boolean;
}
