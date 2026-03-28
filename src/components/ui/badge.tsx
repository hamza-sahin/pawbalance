interface BadgeProps {
  variant?: "default" | "safe" | "caution" | "toxic" | "premium";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: "bg-surface-variant text-txt-secondary border-border",
  safe: "bg-safe-bg text-safe-text border-safe-border",
  caution: "bg-caution-bg text-caution-text border-caution-border",
  toxic: "bg-toxic-bg text-toxic-text border-toxic-border",
  premium: "bg-primary-light/20 text-primary-dark border-primary-light",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
