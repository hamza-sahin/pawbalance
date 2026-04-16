"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { IngredientFormValues } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreparationChips } from "./preparation-chips";

interface IngredientRowProps {
  rowId: string;
  ingredient: IngredientFormValues;
  isExpanded: boolean;
  draft: IngredientFormValues | null;
  error: {
    name: string;
    preparation: string;
  };
  onExpand: () => void;
  onNameChange: (name: string) => void;
  onPreparationChange: (preparation: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function IngredientRow({
  rowId,
  ingredient,
  isExpanded,
  draft,
  error,
  onExpand,
  onNameChange,
  onPreparationChange,
  onSave,
  onCancel,
  onDelete,
}: IngredientRowProps) {
  const t = useTranslations();
  const controlsId = `ingredient-row-editor-${rowId}`;

  if (!isExpanded) {
    return (
      <div className="flex min-h-[56px] items-center gap-2.5 px-3.5">
        <button
          type="button"
          onClick={onExpand}
          className="flex min-h-[56px] flex-1 cursor-pointer touch-manipulation items-center rounded-[12px] py-3 text-left transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={t("editIngredient", { name: ingredient.name })}
          aria-expanded={false}
          aria-controls={controlsId}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-txt">
              {ingredient.name}
            </p>
            <p className="text-xs text-txt-secondary">{ingredient.preparation}</p>
          </div>
        </button>
        <button
          type="button"
          className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-[10px] transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={onDelete}
          aria-label={t("removeIngredient", { name: ingredient.name })}
        >
          <X className="h-[18px] w-[18px] text-txt-tertiary" />
        </button>
      </div>
    );
  }

  return (
    <div
      id={controlsId}
      role="region"
      aria-label={t("editIngredient", { name: ingredient.name })}
      className="space-y-4 px-3.5 py-3.5"
    >
      <Input
        label={t("ingredientNamePlaceholder")}
        placeholder={t("ingredientNamePlaceholder")}
        value={draft?.name ?? ""}
        onChange={(e) => onNameChange(e.target.value)}
        error={error.name}
        autoFocus
      />

      <div>
        <PreparationChips
          value={draft?.preparation ?? ""}
          onChange={onPreparationChange}
        />
        {error.preparation && (
          <p className="mt-1.5 text-sm text-error" role="alert">
            {error.preparation}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onSave}>{t("saveChanges")}</Button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-border px-4 py-2 text-sm font-medium text-txt transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-controls={controlsId}
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-error/30 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("delete")}
        </button>
      </div>
    </div>
  );
}
