interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "error" | "warning" | "info" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "info", className = "" }: BadgeProps) {
  const variants = {
    success: "bg-green-50 text-green-700 border-green-200",
    error:   "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info:    "bg-purple-50 text-purple-700 border-purple-200",
    neutral: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
