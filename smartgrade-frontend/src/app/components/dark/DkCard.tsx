import type { HTMLAttributes, ReactNode } from "react";

interface DkCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  flat?:    boolean;
}

export function DkCard({ children, flat = false, className = "", ...props }: DkCardProps) {
  const cls = ["dk-card", flat ? "dk-card--flat" : "", className].filter(Boolean).join(" ");
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}
