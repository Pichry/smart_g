export function Loader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-2", lg: "w-12 h-12 border-3" };
  return (
    <div className={`${sizes[size]} border-violet-200 border-t-violet-600 rounded-full animate-spin`} />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader size="lg" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
