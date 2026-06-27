

'use client';

import { useState } from 'react';

interface ShortAddressProps {
  address: string;
  /** Number of characters to show at start (default: 6) */
  startChars?: number;
  /** Number of characters to show at end (default: 6) */
  endChars?: number;
  /** Show copy button (default: false) */
  showCopy?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when address is copied */
  onCopy?: () => void;
}

export function ShortAddress({
  address,
  startChars = 6,
  endChars = 6,
  showCopy = false,
  className = '',
  onCopy,
}: ShortAddressProps) {
  const [copied, setCopied] = useState(false);

  const truncated = address.length > startChars + endChars + 3
    ? `${address.slice(0, startChars)}…${address.slice(-endChars)}`
    : address;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  if (showCopy) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-mono">{truncated}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-[var(--pave-orange)] hover:underline"
          title={copied ? 'Copied!' : 'Copy full address'}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    );
  }

  return (
    <span className={`font-mono ${className}`} title={address}>
      {truncated}
    </span>
  );
}
