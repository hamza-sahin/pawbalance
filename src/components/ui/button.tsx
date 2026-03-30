import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-button transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-primary-btn text-white hover:bg-primary-dark shadow-sm active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      secondary: "bg-secondary text-white hover:bg-secondary-dark active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
      outline: "border border-border text-txt hover:bg-surface-variant active:scale-95 active:bg-border/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      ghost: "text-txt hover:bg-surface-variant active:bg-border/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-3 text-base",
      lg: "px-6 py-3.5 text-lg",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
