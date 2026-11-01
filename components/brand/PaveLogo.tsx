import Image from "next/image";
import { cn } from "@/lib/utils";

const MARK = { src: "/pave.png", width: 424, height: 542 };
const LOCKUP = { src: "/pave2.png", width: 946, height: 344 };

interface PaveLogoProps {
  /** Rendered height in px. Width follows the asset's aspect ratio. */
  size?: number;
  /** Show the full mark + "Pave" wordmark lockup; otherwise the mark only. */
  showWordmark?: boolean;
  className?: string;
  priority?: boolean;
}

/**
 * Official Pave logo. The brand orange asset reads well on both light and
 * dark surfaces, so no theme variant is needed.
 */
export function PaveLogo({
  size = 28,
  showWordmark = true,
  className,
  priority = false,
}: PaveLogoProps) {
  const asset = showWordmark ? LOCKUP : MARK;
  const width = Math.round((size * asset.width) / asset.height);

  return (
    <Image
      src={asset.src}
      alt="Pave"
      width={width}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
      style={{ width, height: size }}
    />
  );
}
