import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  const cls = [
    "ds-btn",
    `ds-btn--${variant}`,
    size !== "md" ? `ds-btn--${size}` : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
