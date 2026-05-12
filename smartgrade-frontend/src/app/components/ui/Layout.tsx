import type { HTMLAttributes, ReactNode } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Container({ children, className = "", ...props }: ContainerProps) {
  return (
    <div className={`ds-container ${className}`} {...props}>
      {children}
    </div>
  );
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  alt?: boolean;
  id?: string;
}

export function Section({ children, alt = false, className = "", id, ...props }: SectionProps) {
  const cls = ["ds-section", alt ? "ds-section--alt" : "", className].filter(Boolean).join(" ");
  return (
    <section id={id} className={cls} {...props}>
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="ds-section__header">
      <h2 className="ds-section__title">{title}</h2>
      <div className="ds-section__accent" />
      {subtitle && <p className="ds-section__subtitle" style={{ marginTop: "1rem" }}>{subtitle}</p>}
    </div>
  );
}
