import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Narrower container for form/settings style pages. */
  narrow?: boolean;
}

/** Consistent page width and spacing for dashboard pages. */
export function PageContainer({ children, className, narrow = false }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-7 sm:py-8",
        narrow ? "max-w-[960px]" : "max-w-[1280px]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

/** Financial summary card: label (secondary) / value (primary) / description (muted). */
export function StatCard({ label, value, description, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5", className)}>
      <div className="text-sm font-medium text-text-secondary">{label}</div>
      <div className="mt-2 text-2xl font-semibold leading-tight tracking-tight tabular-nums text-text-primary">
        {value}
      </div>
      {description && <div className="mt-1.5 text-xs text-text-muted">{description}</div>}
    </div>
  );
}
