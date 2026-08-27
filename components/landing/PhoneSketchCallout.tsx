import { Caveat } from "next/font/google";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type PhoneSketchCalloutProps = {
  lines: [string, string];
  /** Arrow points toward the phone from this side of the label. */
  side: "left" | "right";
  className?: string;
};

function LeftArrow() {
  return (
    <svg
      viewBox="0 0 72 52"
      className="mt-1 hidden h-10 w-14 shrink-0 sm:block sm:h-11 sm:w-16"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 14c16-8 34-2 58 28"
        stroke="#2a2a2a"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M52 34l12 8-11 8"
        stroke="#2a2a2a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RightArrow() {
  return (
    <svg
      viewBox="0 0 72 52"
      className="mt-1 hidden h-10 w-14 shrink-0 sm:block sm:h-11 sm:w-16"
      fill="none"
      aria-hidden
    >
      <path
        d="M66 14C50 6 32 12 8 42"
        stroke="#2a2a2a"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M20 34L8 42l11 8"
        stroke="#2a2a2a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhoneSketchCallout({
  lines,
  side,
  className = "",
}: PhoneSketchCalloutProps) {
  const label = (
    <p
      className={`whitespace-pre-line text-[1.35rem] leading-[0.95] font-semibold text-[#2a2a2a] sm:text-[1.55rem] ${
        side === "left" ? "-rotate-[10deg]" : "rotate-[8deg]"
      }`}
    >
      {lines[0]}
      {"\n"}
      {lines[1]}
    </p>
  );

  return (
    <div
      className={`pointer-events-none absolute z-20 flex items-start ${caveat.className} ${className}`}
      aria-hidden
    >
      {side === "left" ? (
        <>
          {label}
          <LeftArrow />
        </>
      ) : (
        <>
          <RightArrow />
          {label}
        </>
      )}
    </div>
  );
}
