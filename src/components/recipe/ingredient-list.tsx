"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PreparationChips } from "./preparation-chips";
import type { IngredientFormValues } from "@/lib/validators";

interface IngredientListProps {
  ingredients: IngredientFormValues[];
  onChange: (ingredients: IngredientFormValues[]) => void;
  error?: string;
}

export function IngredientList({
  ingredients,
  onChange,
  error,
}: IngredientListProps) {
  const t = useTranslations();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [preparation, setPreparation] = useState("Raw");
  const [nameError, setNameError] = useState("");

  const handleAdd = () => {
    if (!name.trim()) {
      setNameError(t("ingredientNameRequired"));
      return;
    }
    onChange([...ingredients, { name: name.trim(), preparation }]);
    setName("");
    setPreparation("Raw");
    setNameError("");
    setShowForm(false);
  };

  const handleRemove = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-txt-secondary">
        {t("ingredients")}
      </label>

      {ingredients.length > 0 && (
        <Card className="mb-3">
          {ingredients.map((ing, i) => (
            <div
              key={i}
              className={`flex min-h-[56px] items-center gap-2.5 px-3.5 ${
                i < ingredients.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-txt">{ing.name}</p>
                <p className="text-xs text-txt-secondary">{ing.preparation}</p>
              </div>
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-[10px] transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => handleRemove(i)}
                aria-label={`Remove ${ing.name}`}
              >
                <X className="h-[18px] w-[18px] text-txt-tertiary" />
              </button>
            </div>
          ))}
        </Card>
      )}

      {ingredients.length === 0 && !showForm && (
        <Card
          className={`mb-3 p-6 text-center ${error ? "border-error" : ""}`}
        >
          <Plus className="mx-auto mb-2 h-6 w-6 text-txt-tertiary" />
          <p className="text-sm text-txt-tertiary">{t("noIngredientsYet")}</p>
        </Card>
      )}

      {error && (
        <p className="mb-2 text-xs text-error" role="alert">
          {error}
        </p>
      )}

      {showForm ? (
        <div className="mb-4 rounded-[14px] border border-border bg-canvas p-3.5">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-txt-secondary">
            {t("addIngredient")}
          </p>
          <Input
            placeholder={t("ingredientNamePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            error={nameError}
            autoFocus
          />
          <div className="mt-2">
            <PreparationChips value={preparation} onChange={setPreparation} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              onClick={() => {
                setShowForm(false);
                setName("");
                setNameError("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              fullWidth
              size="sm"
              onClick={handleAdd}
              disabled={!name.trim()}
            >
              {t("addIngredient")}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex w-full cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-border-secondary p-3 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          {t("addIngredient")}
        </button>
      )}
    </div>
  );
}
