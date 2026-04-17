import { type InputHTMLAttributes, forwardRef, useId } from "react";
import {
  getDefaultAutoCapitalize,
  getDefaultAutoCorrect,
  getDefaultSpellCheck,
} from "@/lib/input-capitalization";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = "",
      id: externalId,
      autoCapitalize,
      autoCorrect,
      spellCheck,
      inputMode,
      type,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = error ? `${id}-error` : undefined;
    const resolvedAutoCapitalize =
      autoCapitalize ??
      getDefaultAutoCapitalize({
        type,
        inputMode,
      });
    const resolvedAutoCorrect =
      autoCorrect ??
      getDefaultAutoCorrect({
        type,
        inputMode,
      });
    const resolvedSpellCheck =
      spellCheck ??
      getDefaultSpellCheck({
        type,
        inputMode,
      });

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-txt-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          inputMode={inputMode}
          autoCapitalize={resolvedAutoCapitalize}
          autoCorrect={resolvedAutoCorrect}
          spellCheck={resolvedSpellCheck}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`rounded-input border border-border bg-surface-variant px-4 py-3 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${error ? "border-error" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
