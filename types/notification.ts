export type NotificationType = 
  | 'payment_settled' 
  | 'payment_failed' 
  | 'webhook_delivered' 
  | 'payout_processing' 
  | 'weekly_summary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  description?: string;
  timestamp?: string;
  createdAt?: string;
  read: boolean;
  link?: string;
}
