"use client";

import { useEffect, useRef, useId, type ReactNode } from "react";
import { Icons } from "@/components/ui/icon";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={titleId}
      className="safe-top m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-border bg-surface p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold text-txt">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-txt-secondary transition-all duration-150 ease-out hover:bg-surface-variant active:scale-90 active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icons.close className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
