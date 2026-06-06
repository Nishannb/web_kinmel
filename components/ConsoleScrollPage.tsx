"use client";

import type { ReactNode } from "react";

type ConsoleScrollPageProps = {
  header: ReactNode;
  children: ReactNode;
};

/** Fixed page header + scrollable body for console routes. */
export function ConsoleScrollPage({ header, children }: ConsoleScrollPageProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0">{header}</div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
