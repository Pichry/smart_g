import type { ButtonHTMLAttributes, ReactNode } from "react";

type DkButtonVariant = "primary" | "outline" | "ghost" | "white";
type DkButtonSize    = "sm" | "md" | "lg";

interface DkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  DkButtonVariant;
  size?:     DkButtonSize;
  children:  ReactNode;
}

export function DkButton({
  variant = "primary",
  size    = "md",
  className = "",
  children,
  ...props
}: DkButtonProps) {
  const cls = [
    "dk-btn",
    `dk-btn--${variant}`,
    size !== "md" ? `dk-btn--${size}` : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
