"use client";

import { useState, useMemo, useRef, useEffect, useId } from "react";
import { DOG_BREEDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

interface BreedSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function BreedSelector({ value, onChange }: BreedSelectorProps) {
  const t = useTranslations();
  const [search, setSearch] = useState(value ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listboxId = useId();

  const filtered = useMemo(() => {
    if (!search) return DOG_BREEDS;
    const lower = search.toLowerCase();
    return DOG_BREEDS.filter((b) => b.toLowerCase().includes(lower)).slice(0, 20);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const el = listboxRef.current.children[activeIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      setActiveIndex(0);
      e.preventDefault();
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          onChange(filtered[activeIndex]);
          setSearch(filtered[activeIndex]);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-txt-secondary">
        {t("petBreed")}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => { if (search) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={t("selectBreed")}
        className="rounded-input border border-border bg-surface-variant px-4 py-3 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
      {isOpen && search && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-card border border-border bg-surface shadow-lg"
        >
          {filtered.length > 0 ? (
            filtered.map((breed, i) => (
              <div
                key={breed}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={value === breed}
                onClick={() => {
                  onChange(breed);
                  setSearch(breed);
                  setIsOpen(false);
                }}
                className={`cursor-pointer px-4 py-2 text-sm ${
                  i === activeIndex ? "bg-primary/10 text-primary" : ""
                } ${value === breed ? "font-medium text-primary" : "text-txt"} hover:bg-surface-variant`}
              >
                {breed}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-txt-tertiary">
              {t("noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
