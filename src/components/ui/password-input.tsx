"use client";

import { type InputHTMLAttributes, forwardRef, useId, useState } from "react";
import { Icons } from "@/components/ui/icon";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className = "", id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = error ? `${id}-error` : undefined;
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-txt-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={`w-full rounded-input border border-border bg-surface-variant px-4 py-3 pr-12 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${error ? "border-error" : ""} ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-txt-tertiary hover:text-txt focus-visible:ring-2 focus-visible:ring-primary"
          >
            {visible ? (
              <Icons.eyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Icons.eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
