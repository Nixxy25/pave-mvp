import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <p className="text-sm max-sm:text-xs text-muted-foreground">
            © 2026 Pave. All rights reserved.
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-sm max-sm:text-xs text-muted-foreground">
          <Link href="/api-webhooks" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <a href="mailto:paveng24@gmail.com" className="hover:text-foreground transition-colors">
            Support
          </a>
          <a 
            href="https://x.com/paveng_" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-foreground transition-colors"
            aria-label="X (Twitter)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
