"use client";

import { Icons } from "@/components/ui/icon";

type PageHeaderProps = {
  title: string;
  backLabel: string;
  onBack: () => void;
};

export function PageHeader({ title, backLabel, onBack }: PageHeaderProps) {
  return (
    <div className="safe-sticky-top sticky z-10 flex items-center gap-3 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur-sm">
      <button
        type="button"
        onClick={onBack}
        className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors active:bg-border/50"
        aria-label={backLabel}
      >
        <Icons.arrowLeft className="h-5 w-5 text-txt" />
      </button>
      <h1 className="text-lg font-bold text-txt">{title}</h1>
    </div>
  );
}
