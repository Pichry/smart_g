import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  flat?: boolean;
}

export function Card({ children, flat = false, className = "", ...props }: CardProps) {
  const cls = ["ds-card", flat ? "ds-card--flat" : "", className].filter(Boolean).join(" ");
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}
