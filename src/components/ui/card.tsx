import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Card({
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
