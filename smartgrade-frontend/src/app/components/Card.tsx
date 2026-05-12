interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", onClick, hover, style }: CardProps) {
  const interactive = onClick || hover;
  return (
    <div
      className={`app-card ${interactive ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200" : ""} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
