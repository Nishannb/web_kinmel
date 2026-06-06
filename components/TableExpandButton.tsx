"use client";

type TableExpandButtonProps = {
  expanded: boolean;
  onToggle: () => void;
  label?: string;
};

export function TableExpandButton({
  expanded,
  onToggle,
  label = "Show details",
}: TableExpandButtonProps) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-label={expanded ? "Hide details" : label}
      onClick={onToggle}
      className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
      title={expanded ? "Hide details" : label}
    >
      <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
      <svg
        className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
