"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { ingredientSchema, type IngredientFormValues } from "@/lib/validators";
import { useFoodSuggestions } from "@/hooks/use-food-search";
import { useLocale } from "@/hooks/use-locale";
import { useSheetDrag } from "@/hooks/use-sheet-drag";
import { localise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreparationChips } from "./preparation-chips";

interface AddIngredientSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (ingredient: IngredientFormValues) => void;
}

export function AddIngredientSheet({
  open,
  onClose,
  onAdd,
}: AddIngredientSheetProps) {
  if (!open) return null;

  return <AddIngredientSheetInner onClose={onClose} onAdd={onAdd} />;
}

function AddIngredientSheetInner({
  onClose,
  onAdd,
}: Omit<AddIngredientSheetProps, "open">) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [name, setName] = useState("");
  const [preparation, setPreparation] = useState("");
  const [nameError, setNameError] = useState("");
  const [preparationError, setPreparationError] = useState("");
  const { suggestions, isLoading } = useFoodSuggestions(name);
  const { sheetRef, maximized, handlers: dragHandlers } = useSheetDrag({
    onDismiss: onClose,
  });

  function handleSubmit() {
    const parsed = ingredientSchema.safeParse({
      name: name.trim(),
      preparation: preparation.trim(),
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setNameError(fieldErrors.name?.[0] ?? "");
      setPreparationError(fieldErrors.preparation?.[0] ?? "");
      return;
    }

    onAdd(parsed.data);
    onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        {...dragHandlers}
        role="dialog"
        aria-modal="true"
        aria-label={t("addIngredient")}
        className={`fixed inset-x-0 bottom-0 z-[60] overflow-y-auto bg-surface p-5 pb-8 shadow-xl transition-[border-radius,max-height] duration-250 ease-out motion-safe:animate-slide-up ${
          maximized
            ? "max-h-[100dvh] rounded-t-none"
            : "max-h-[90dvh] rounded-t-[20px]"
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-txt">
              {t("addIngredient")}
            </h2>
            <p className="mt-1 text-sm text-txt-secondary">
              {t("ingredientNamePlaceholder")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-[12px] text-txt-secondary transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={t("cancel")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label={t("ingredientNamePlaceholder")}
            placeholder={t("ingredientNamePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            error={nameError}
            autoFocus
          />

          {(isLoading || suggestions.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-txt-secondary">
                {t("ingredients")}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((food) => {
                  const localisedName = localise(food, "name", locale);
                  const isSelected =
                    name.trim().toLowerCase() === localisedName.toLowerCase();

                  return (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => {
                        setName(localisedName);
                        setNameError("");
                      }}
                      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border px-3 py-2 text-left text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface text-txt-secondary"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                      <span>{localisedName}</span>
                    </button>
                  );
                })}
                {isLoading && (
                  <div className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] text-txt-secondary">
                    {t("ingredients")}...
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <PreparationChips
              value={preparation}
              onChange={(value) => {
                setPreparation(value);
                if (preparationError) setPreparationError("");
              }}
            />
            {preparationError && (
              <p className="mt-1.5 text-sm text-error" role="alert">
                {preparationError}
              </p>
            )}
          </div>

          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={!name.trim() || !preparation.trim()}
          >
            {t("addIngredient")}
          </Button>
        </div>
      </div>
    </>
  );
}
