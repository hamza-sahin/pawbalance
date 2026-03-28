"use client";

import { useState, useMemo } from "react";
import { DOG_BREEDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

interface BreedSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function BreedSelector({ value, onChange }: BreedSelectorProps) {
  const t = useTranslations();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return DOG_BREEDS;
    const lower = search.toLowerCase();
    return DOG_BREEDS.filter((b) => b.toLowerCase().includes(lower));
  }, [search]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-txt-secondary">
        {t("petBreed")}
      </label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("selectBreed")}
        className="rounded-input border border-border bg-surface-variant px-4 py-3 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary focus:ring-1 focus:ring-primary"
      />
      {search && filtered.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-card border border-border bg-surface shadow-lg">
          {filtered.slice(0, 20).map((breed) => (
            <button
              key={breed}
              type="button"
              onClick={() => {
                onChange(breed);
                setSearch(breed);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-variant ${
                value === breed ? "bg-primary/10 font-medium text-primary" : "text-txt"
              }`}
            >
              {breed}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
