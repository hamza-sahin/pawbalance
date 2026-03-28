import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "button";
}

export function Card({
  className = "",
  children,
  as: Tag = "div",
  ...props
}: CardProps) {
  return (
    <Tag
      className={`rounded-card border border-border bg-surface shadow-sm ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
