"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFoodSearch, useCategories } from "@/hooks/use-food-search";
import { usePetStore } from "@/store/pet-store";
import { FoodCard } from "@/components/food/food-card";
import { CategoryGrid } from "@/components/food/category-grid";
import { FoodRequestDialog } from "@/components/food/food-request-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SEARCH_DEBOUNCE_MS, MIN_SEARCH_LENGTH } from "@/lib/constants";
import { Icons } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";

export default function SearchPage() {
  const t = useTranslations();
  const { results, isSearching, search, clearSearch } = useFoodSearch();
  const { categories, isLoading: catsLoading, fetchCategories } = useCategories();
  const selectedPet = usePetStore((s) => {
    const id = s.selectedPetId;
    return s.pets.find((p) => p.id === id) ?? null;
  });

  const [query, setQuery] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounced search
  useEffect(() => {
    if (query.length < MIN_SEARCH_LENGTH) {
      clearSearch();
      return;
    }
    const timer = setTimeout(() => search(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, search, clearSearch]);

  const hasQuery = query.length >= MIN_SEARCH_LENGTH;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-txt">
            {selectedPet
              ? t("canEat", { petName: selectedPet.name })
              : t("searchFoods")}
          </h1>
          <p className="text-sm text-txt-secondary">
            {t("searchFoods")}
          </p>
        </div>
        {selectedPet && (
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant text-lg">
              {selectedPet.avatar_url ? (
                <img src={selectedPet.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <Icons.paw className="h-5 w-5 text-txt-tertiary" aria-hidden="true" />
              )}
            </div>
            <span className="text-xs text-txt-secondary">{selectedPet.name}</span>
            {selectedPet.breed && (
              <span className="text-[10px] text-txt-tertiary">{selectedPet.breed}</span>
            )}
          </div>
        )}
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-tertiary" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchFoods")}
          className="w-full rounded-input border border-border bg-surface py-3 pl-10 pr-10 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); clearSearch(); }}
            aria-label={t("cancel")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-tertiary transition-opacity duration-150 hover:text-txt active:opacity-50"
          >
            <Icons.close className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Results or categories */}
      {hasQuery ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-txt-secondary">
            {t("resultsFor", { count: results.length, query })}
          </p>
          {isSearching ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : results.length > 0 ? (
            results.map((food) => <FoodCard key={food.id} food={food} />)
          ) : (
            <div className="flex flex-col gap-4">
              <EmptyState
                icon="searchX"
                title={t("noResults")}
                subtitle={t("noResultsSubtitle")}
                action={{
                  label: t("browseCategories"),
                  onClick: () => { setQuery(""); clearSearch(); },
                }}
              />
              <button
                onClick={() => setShowRequestDialog(true)}
                className="mx-auto min-h-[44px] inline-flex items-center rounded-button px-4 text-sm font-medium text-primary transition-all duration-150 ease-out hover:bg-primary/5 active:scale-95 active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t("requestFood")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="mb-1 text-lg font-bold text-txt">{t("browseByCategory")}</h2>
          <p className="mb-4 text-sm text-txt-secondary">{t("exploreByType")}</p>
          {catsLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <CategoryGrid categories={categories} />
          )}
        </div>
      )}

      <FoodRequestDialog
        open={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        initialFoodName={query}
      />
    </div>
  );
}
