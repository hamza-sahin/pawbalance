"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ingredientSchema,
  type IngredientFormValues,
} from "@/lib/validators";
import { AddIngredientSheet } from "./add-ingredient-sheet";
import { IngredientRow } from "./ingredient-row";

interface IngredientListProps {
  ingredients: IngredientFormValues[];
  onChange: (ingredients: IngredientFormValues[]) => void;
  error?: string;
}

const EMPTY_EDIT_ERROR = {
  name: "",
  preparation: "",
};

export function IngredientList({
  ingredients,
  onChange,
  error,
}: IngredientListProps) {
  const t = useTranslations();
  const [showSheet, setShowSheet] = useState(false);
  const nextRowIdRef = useRef(0);
  const rowIdMapRef = useRef(new WeakMap<IngredientFormValues, string>());
  const rowIds = useMemo(
    () =>
      ingredients.map((ingredient) => {
        const existingId = rowIdMapRef.current.get(ingredient);

        if (existingId) {
          return existingId;
        }

        const nextId = `ingredient-row-${nextRowIdRef.current++}`;
        rowIdMapRef.current.set(ingredient, nextId);
        return nextId;
      }),
    [ingredients],
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<IngredientFormValues | null>(null);
  const [editError, setEditError] = useState(EMPTY_EDIT_ERROR);
  const headingId = "recipe-ingredients-heading";

  const handleAdd = (ingredient: IngredientFormValues) => {
    resetExpandedEditor();
    onChange([ingredient, ...ingredients]);
  };

  const resetExpandedEditor = () => {
    setExpandedRowId(null);
    setDraft(null);
    setEditError(EMPTY_EDIT_ERROR);
  };

  const getExpandedIndex = () =>
    expandedRowId === null ? -1 : rowIds.indexOf(expandedRowId);

  const persistExpandedDraft = () => {
    const expandedIndex = getExpandedIndex();

    if (expandedIndex === -1 || !draft) {
      return true;
    }

    const parsed = ingredientSchema.safeParse({
      name: draft.name.trim(),
      preparation: draft.preparation.trim(),
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setEditError({
        name: fieldErrors.name?.[0] ?? "",
        preparation: fieldErrors.preparation?.[0] ?? "",
      });
      return false;
    }

    setEditError(EMPTY_EDIT_ERROR);

    const currentIngredient = ingredients[expandedIndex];
    const changed =
      currentIngredient?.name !== parsed.data.name ||
      currentIngredient?.preparation !== parsed.data.preparation;

    if (!changed) {
      return true;
    }

    onChange(
      ingredients.map((ingredient, index) =>
        index === expandedIndex ? parsed.data : ingredient,
      ),
    );

    return true;
  };

  const handleExpand = (rowId: string, ingredient: IngredientFormValues) => {
    if (expandedRowId === rowId) {
      return;
    }

    if (!persistExpandedDraft()) {
      return;
    }

    setExpandedRowId(rowId);
    setDraft({ ...ingredient });
    setEditError(EMPTY_EDIT_ERROR);
  };

  const handleSave = () => {
    if (!persistExpandedDraft()) {
      return;
    }

    resetExpandedEditor();
  };

  const handleCancel = () => {
    resetExpandedEditor();
  };

  const handleOpenAddSheet = () => {
    if (!persistExpandedDraft()) {
      return;
    }

    resetExpandedEditor();
    setShowSheet(true);
  };

  const handleRemove = (index: number) => {
    const rowIdToRemove = rowIds[index];

    onChange(ingredients.filter((_, i) => i !== index));

    if (expandedRowId === null) {
      return;
    }

    if (rowIdToRemove === expandedRowId) {
      resetExpandedEditor();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2
            id={headingId}
            className="text-[13px] font-medium text-txt-secondary"
          >
            {t("ingredients")}
          </h2>
          <p className="mt-1 text-sm text-txt-secondary">
            {t("ingredientCount", { count: ingredients.length })}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] border border-dashed border-border-secondary px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={handleOpenAddSheet}
        >
          <Plus className="h-4 w-4" />
          {t("addIngredient")}
        </button>
      </div>

      {ingredients.length > 0 && (
        <Card>
          <ul aria-labelledby={headingId}>
            {ingredients.map((ing, i) => (
              <li
                key={rowIds[i] ?? i}
                className={i < ingredients.length - 1 ? "border-b border-border" : ""}
              >
                <IngredientRow
                  rowId={rowIds[i]}
                  ingredient={ing}
                  isExpanded={expandedRowId === rowIds[i]}
                  draft={expandedRowId === rowIds[i] ? draft : null}
                  error={expandedRowId === rowIds[i] ? editError : EMPTY_EDIT_ERROR}
                  onExpand={() => handleExpand(rowIds[i], ing)}
                  onNameChange={(name) => {
                    setDraft((currentDraft) =>
                      currentDraft
                        ? {
                            ...currentDraft,
                            name,
                          }
                        : currentDraft,
                    );

                    if (editError.name) {
                      setEditError((currentError) => ({
                        ...currentError,
                        name: "",
                      }));
                    }
                  }}
                  onPreparationChange={(preparation) => {
                    setDraft((currentDraft) =>
                      currentDraft
                        ? {
                            ...currentDraft,
                            preparation,
                          }
                        : currentDraft,
                    );

                    if (editError.preparation) {
                      setEditError((currentError) => ({
                        ...currentError,
                        preparation: "",
                      }));
                    }
                  }}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onDelete={() => handleRemove(i)}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {ingredients.length === 0 && (
        <Card className={error ? "border-error" : ""}>
          <EmptyState
            icon="bowl"
            title={t("ingredients")}
            subtitle={t("noIngredientsYet")}
          />
        </Card>
      )}

      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}

      <AddIngredientSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}
