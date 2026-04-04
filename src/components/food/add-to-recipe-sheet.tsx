"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/store/recipe-store";
import { Icons } from "@/components/ui/icon";

interface AddToRecipeSheetProps {
  open: boolean;
  onClose: () => void;
  foodName: string;
  preparation?: string;
  onAdded?: (recipeName: string) => void;
}

export function AddToRecipeSheet({ open, onClose, onAdded }: AddToRecipeSheetProps) {
  const t = useTranslations();
  const router = useRouter();
  const recipes = useRecipeStore((s) => s.recipes);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[20px] bg-surface p-5 pb-8 shadow-xl motion-safe:animate-slide-up">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h3 className="mb-4 text-center text-base font-semibold text-txt">
          {t("selectRecipe")}
        </h3>

        {recipes.length === 0 ? (
          <p className="mb-4 text-center text-sm text-txt-secondary">
            {t("noRecipesCreateFirst")}
          </p>
        ) : (
          <div className="mb-4 flex max-h-[240px] flex-col gap-2 overflow-y-auto">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => {
                  onAdded?.(recipe.name);
                  onClose();
                }}
                className="flex min-h-[44px] items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-left transition-all duration-150 ease-out active:scale-95 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icons.bowl className="h-5 w-5 text-txt-tertiary" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-txt">{recipe.name}</p>
                  <p className="text-xs text-txt-secondary">
                    {t("ingredientCount", { count: recipe.recipe_ingredients.length })}
                  </p>
                </div>
                <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            onClose();
            router.push("/recipes/new");
          }}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-button border border-dashed border-border py-3 text-sm font-medium text-primary transition-all duration-150 ease-out active:scale-95 active:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icons.plus className="h-4 w-4" aria-hidden="true" />
          {t("createNewRecipe")}
        </button>
      </div>
    </>
  );
}
