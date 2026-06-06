import Image from "next/image";
import Link from "next/link";

/** Pixel sizes that exist under `/public/kinmel-logo/` */
const SRC_PX = {
  sm: 48,
  md: 96,
  lg: 192,
} as const;

export type KinmelLogoSize = keyof typeof SRC_PX;

type KinmelLogoMarkProps = {
  size?: KinmelLogoSize;
  className?: string;
  priority?: boolean;
};

/** Square mark only (no link). */
export function KinmelLogoMark({ size = "md", className, priority }: KinmelLogoMarkProps) {
  const px = SRC_PX[size];
  return (
    <Image
      src={`/kinmel-logo/${px}.png`}
      alt="Kinmel"
      width={px}
      height={px}
      className={className}
      priority={priority}
    />
  );
}

type KinmelBrandLinkProps = {
  size?: KinmelLogoSize;
  className?: string;
  /** If false, only the logo image is shown (still links home). */
  showWordmark?: boolean;
  wordmarkClassName?: string;
  /** `neutral` matches zinc/emerald checkout chrome. */
  tone?: "brand" | "neutral";
};

/** Logo + “Kinmel” wordmark linking home. */
export function KinmelBrandLink({
  size = "md",
  className = "",
  showWordmark = true,
  wordmarkClassName,
  tone = "brand",
}: KinmelBrandLinkProps) {
  const focusRing = tone === "neutral" ? "focus-visible:ring-zinc-400/35" : "focus-visible:ring-violet-400/30";
  const ringColor = tone === "neutral" ? "ring-zinc-200" : "ring-violet-200/80";
  const markFrame =
    size === "lg"
      ? `size-14 shrink-0 rounded-2xl shadow-sm ring-1 ${ringColor} sm:size-16`
      : size === "sm"
        ? `size-8 shrink-0 rounded-lg shadow-sm ring-1 ${ringColor} sm:size-9`
        : `size-9 shrink-0 rounded-xl shadow-sm ring-1 ${ringColor} sm:size-10`;
  const wordmark =
    wordmarkClassName ??
    (tone === "neutral"
      ? "truncate text-sm font-semibold text-zinc-900"
      : size === "lg"
        ? "text-2xl font-extrabold tracking-tight text-violet-950 sm:text-3xl"
        : "text-xl font-extrabold tracking-tight text-violet-950 sm:text-2xl");

  return (
    <Link
      href="/"
      className={`inline-flex min-w-0 max-w-full items-center gap-2.5 rounded-xl outline-none transition hover:opacity-90 focus-visible:ring-2 ${focusRing} ${className}`}>
      <KinmelLogoMark size={size} priority className={markFrame} />
      {showWordmark ? <span className={wordmark}>Kinmel</span> : null}
    </Link>
  );
}
