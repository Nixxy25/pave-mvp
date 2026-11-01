import { cn } from "@/lib/utils";

export type StatusTone = "success" | "pending" | "failed" | "expired" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, { badge: string; dot: string }> = {
  success: { badge: "bg-status-success-bg text-status-success", dot: "bg-status-success" },
  pending: { badge: "bg-status-pending-bg text-status-pending", dot: "bg-status-pending" },
  failed: { badge: "bg-status-failed-bg text-status-failed", dot: "bg-status-failed" },
  expired: { badge: "bg-status-expired-bg text-status-expired", dot: "bg-status-expired" },
  info: { badge: "bg-status-info-bg text-status-info", dot: "bg-status-info" },
  neutral: { badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

const STATUS_TONES: Record<string, StatusTone> = {
  completed: "success",
  complete: "success",
  confirmed: "success",
  success: "success",
  succeeded: "success",
  settled: "success",
  paid: "success",
  active: "success",
  approved: "info",
  submitted: "info",
  requested: "pending",
  reconciliation_required: "pending",
  verified: "success",
  healthy: "success",
  ok: "success",
  pending: "pending",
  processing: "pending",
  in_progress: "pending",
  awaiting: "pending",
  awaiting_payment: "pending",
  review: "pending",
  needs_review: "pending",
  warning: "pending",
  failed: "failed",
  failure: "failed",
  error: "failed",
  rejected: "failed",
  declined: "failed",
  cancelled: "failed",
  canceled: "failed",
  suspended: "failed",
  expired: "expired",
  inactive: "expired",
  disabled: "expired",
  info: "info",
};

export function getStatusTone(status: string): StatusTone {
  return STATUS_TONES[status.trim().toLowerCase().replace(/[\s-]+/g, "_")] ?? "neutral";
}

function formatLabel(status: string): string {
  const label = status.replace(/[_-]+/g, " ").trim().toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

interface StatusBadgeProps {
  /** Raw status string (e.g. "completed", "PENDING"). Mapped to a semantic tone. */
  status: string;
  /** Override the tone inferred from `status`. */
  tone?: StatusTone;
  /** Override the displayed text. */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, tone, label, className }: StatusBadgeProps) {
  const classes = TONE_CLASSES[tone ?? getStatusTone(status)];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-none px-2 py-0.5 text-xs font-medium",
        classes.badge,
        className
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", classes.dot)} />
      {label ?? formatLabel(status)}
    </span>
  );
}
