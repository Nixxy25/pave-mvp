import { Lock } from 'lucide-react';
import { SignInButton } from '@/features/merchant/components/SignInButton';

interface SignInPromptProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function SignInPrompt({ 
  title = "Sign In Required",
  description = "Please sign in to access this feature",
  icon
}: SignInPromptProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        {icon ? (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-muted">
            {icon}
          </div>
        ) : (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-muted">
<Lock aria-hidden="true" className="size-8 stroke-[1.5] text-text-muted" />
          </div>
        )}
        <h2 className="mb-2 text-lg font-semibold text-text-primary">{title}</h2>
        <p className="mb-4 text-sm text-text-secondary">{description}</p>
        <SignInButton />
      </div>
    </div>
  );
}
