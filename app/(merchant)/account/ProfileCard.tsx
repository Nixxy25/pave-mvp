'use client';


interface ProfileCardProps {
  fullName: string;
  email: string;
}

export function ProfileCard({
  fullName,
  email,
}: ProfileCardProps) {
  return (
    <div
      className="animate-fadeup rounded-xl border bg-card p-4 sm:p-6"
      style={{ animationDelay: '0.07s' }}
    >
      <h2 className="mb-4 text-base font-semibold text-text-primary">
        Profile Information
      </h2>

      <div className="space-y-4">
        <div>
          <div className="mb-1 text-xs font-medium text-text-muted">Full Name</div>
          <div className="text-sm text-text-primary">{fullName}</div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-text-muted">Email Address</div>
          <div className="text-sm text-text-primary">{email}</div>
        </div>
      </div>
    </div>
  );
}
