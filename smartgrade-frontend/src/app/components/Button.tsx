import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", loading = false, className = "", children, disabled, style, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none border-0 cursor-pointer";

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary:   { background: "var(--color-primary)",      color: "#fff",                          boxShadow: "0 3px 10px rgba(108,92,231,0.3)" },
    secondary: { background: "rgba(108,92,231,0.08)",     color: "var(--color-primary)",          border: "1px solid rgba(108,92,231,0.2)" },
    outline:   { background: "transparent",               color: "var(--color-text-primary)",     border: "1px solid var(--color-border)" },
    ghost:     { background: "transparent",               color: "var(--color-text-secondary)" },
    danger:    { background: "#EF4444",                   color: "#fff",                          boxShadow: "0 2px 8px rgba(239,68,68,0.3)" },
  };

  const hoverClass: Record<string, string> = {
    primary:   "hover:opacity-90 hover:-translate-y-px",
    secondary: "hover:bg-purple-100",
    outline:   "hover:border-purple-400 hover:text-purple-600",
    ghost:     "hover:bg-gray-100",
    danger:    "hover:opacity-90",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${hoverClass[variant]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
