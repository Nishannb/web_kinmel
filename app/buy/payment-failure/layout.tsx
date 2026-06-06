import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Payment",
};

export default function PaymentFailureLayout({ children }: { children: ReactNode }) {
  return children;
}
