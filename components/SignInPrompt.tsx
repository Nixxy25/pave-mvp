import { SignInButton } from '@/components/SignInButton';

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
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
        <h2 className="mb-2 text-lg font-medium text-foreground">{title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        <SignInButton />
      </div>
    </div>
  );
}
