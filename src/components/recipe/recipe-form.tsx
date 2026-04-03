"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IngredientList } from "./ingredient-list";
import { usePetStore } from "@/store/pet-store";
import type { RecipeFormValues, IngredientFormValues } from "@/lib/validators";
import { recipeFormSchema } from "@/lib/validators";
import { Search } from "lucide-react";

interface RecipeFormProps {
  initialValues?: RecipeFormValues;
  onSubmit: (values: RecipeFormValues) => Promise<void>;
  onAnalyze?: () => void;
  showAnalyze?: boolean;
  isSubmitting?: boolean;
}

export function RecipeForm({
  initialValues,
  onSubmit,
  onAnalyze,
  showAnalyze = false,
  isSubmitting = false,
}: RecipeFormProps) {
  const t = useTranslations();
  const { pets } = usePetStore();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [petId, setPetId] = useState<string | null>(
    initialValues?.pet_id ?? null,
  );
  const [ingredients, setIngredients] = useState<IngredientFormValues[]>(
    initialValues?.ingredients ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    const values: RecipeFormValues = {
      name,
      pet_id: petId,
      ingredients,
    };
    const result = recipeFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  };

  return (
    <div className="space-y-5">
      {/* Recipe name */}
      <div>
        <Input
          label={t("recipeName")}
          placeholder={t("recipeNamePlaceholder")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          error={errors.name ? t("recipeNameRequired") : undefined}
        />
      </div>

      {/* Pet selector */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-txt-secondary">
          {t("forWhichPet")}
        </label>
        <div className="flex flex-wrap gap-2">
          {pets.map((pet) => (
            <button
              key={pet.id}
              type="button"
              className={`flex min-h-[44px] cursor-pointer touch-manipulation items-center gap-1.5 rounded-[10px] border px-4 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                petId === pet.id
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-txt-secondary"
              }`}
              onClick={() => setPetId(pet.id)}
            >
              {pet.name}
            </button>
          ))}
          <button
            type="button"
            className={`flex min-h-[44px] cursor-pointer touch-manipulation items-center rounded-[10px] border border-dashed px-4 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              petId === null
                ? "border-primary bg-primary text-white"
                : "border-border-secondary text-txt-secondary"
            }`}
            onClick={() => setPetId(null)}
          >
            {t("nonePet")}
          </button>
        </div>
      </div>

      {/* Ingredients */}
      <IngredientList
        ingredients={ingredients}
        onChange={(updated) => {
          setIngredients(updated);
          if (errors.ingredients)
            setErrors((prev) => ({ ...prev, ingredients: "" }));
        }}
        error={
          errors.ingredients ? t("addAtLeastOneIngredient") : undefined
        }
      />

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <Button fullWidth isLoading={isSubmitting} onClick={handleSave}>
          {t("saveRecipe")}
        </Button>
        {showAnalyze && onAnalyze && (
          <Button fullWidth variant="secondary" onClick={onAnalyze}>
            <Search className="mr-2 h-[18px] w-[18px]" />
            {t("analyzeRecipe")}
          </Button>
        )}
      </div>
    </div>
  );
}
