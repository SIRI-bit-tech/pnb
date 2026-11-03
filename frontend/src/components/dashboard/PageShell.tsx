import React from "react";

type MaxWidth = "sm" | "md" | "lg" | "full";

const MAX_W: Record<MaxWidth, string> = {
  sm:   "max-w-xl",
  md:   "max-w-3xl",
  lg:   "max-w-5xl",
  full: "max-w-none",
};

interface PageShellProps {
  children: React.ReactNode;
  maxWidth?: MaxWidth;
}

export default function PageShell({ children, maxWidth = "full" }: PageShellProps) {
  return (
    <div className={`flex flex-col gap-6 w-full ${MAX_W[maxWidth]}`}>
      {children}
    </div>
  );
}
