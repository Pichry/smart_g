import type { HTMLAttributes, ReactNode } from "react";

interface DkContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DkContainer({ children, className = "", ...props }: DkContainerProps) {
  return (
    <div className={`dk-container ${className}`} {...props}>
      {children}
    </div>
  );
}
