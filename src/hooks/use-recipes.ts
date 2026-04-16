"use client";

import { useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRecipeStore } from "@/store/recipe-store";
import { useAuthStore } from "@/store/auth-store";
import type {
  RecipeWithIngredients,
  RecipeIngredient,
  RecipeAnalysis,
} from "@/lib/types";
import type { RecipeFormValues } from "@/lib/validators";

export function useRecipes() {
  const { user } = useAuthStore();
  const {
    recipes,
    isLoading,
    setRecipes,
    addRecipe,
    updateRecipe,
    removeRecipe,
    setLoading,
    analyses,
    setAnalysis,
    recipesLoadedAt,
    setRecipesWithTimestamp,
  } = useRecipeStore();

  const fetchRecipes = useCallback(async () => {
    if (!user) return;

    // Only show loading skeleton on first load (no cached data)
    const hasCache = useRecipeStore.getState().recipes.length > 0;
    if (!hasCache) setLoading(true);

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("recipes")
        .select("*, recipe_ingredients(*)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRecipesWithTimestamp(data as RecipeWithIngredients[]);

      // Fetch latest analysis per recipe
      const recipeIds = (data ?? []).map((r: any) => r.id);
      if (recipeIds.length > 0) {
        const { data: analysesData } = await supabase
          .from("recipe_analyses")
          .select("*")
          .in("recipe_id", recipeIds)
          .order("created_at", { ascending: false });
        if (analysesData) {
          const latestByRecipe: Record<string, RecipeAnalysis> = {};
          for (const a of analysesData as RecipeAnalysis[]) {
            if (!latestByRecipe[a.recipe_id]) {
              latestByRecipe[a.recipe_id] = a;
            }
          }
          for (const [recipeId, analysis] of Object.entries(latestByRecipe)) {
            setAnalysis(recipeId, analysis);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, setRecipesWithTimestamp, setLoading, setAnalysis]);

  const createRecipe = useCallback(
    async (values: RecipeFormValues): Promise<RecipeWithIngredients> => {
      if (!user) throw new Error("Not authenticated");
      const supabase = getSupabase();

      // Insert recipe
      const { data: recipe, error } = await supabase
        .from("recipes")
        .insert({
          owner_id: user.id,
          name: values.name,
          pet_id: values.pet_id,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert ingredients
      const ingredients = values.ingredients.map((ing, i) => ({
        recipe_id: recipe.id,
        name: ing.name,
        preparation: ing.preparation,
        sort_order: i,
      }));
      const { data: ingData, error: ingError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredients)
        .select();
      if (ingError) throw ingError;

      const full: RecipeWithIngredients = {
        ...recipe,
        recipe_ingredients: ingData as RecipeIngredient[],
      };
      addRecipe(full);
      return full;
    },
    [user, addRecipe],
  );

  const editRecipe = useCallback(
    async (
      recipeId: string,
      values: RecipeFormValues,
    ): Promise<RecipeWithIngredients> => {
      if (!user) throw new Error("Not authenticated");
      const supabase = getSupabase();

      // Update recipe
      const { data: recipe, error } = await supabase
        .from("recipes")
        .update({ name: values.name, pet_id: values.pet_id })
        .eq("id", recipeId)
        .select()
        .single();
      if (error) throw error;

      // Replace all ingredients (delete + insert)
      await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", recipeId);

      const ingredients = values.ingredients.map((ing, i) => ({
        recipe_id: recipeId,
        name: ing.name,
        preparation: ing.preparation,
        sort_order: i,
      }));
      const { data: ingData, error: ingError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredients)
        .select();
      if (ingError) throw ingError;

      const full: RecipeWithIngredients = {
        ...recipe,
        recipe_ingredients: ingData as RecipeIngredient[],
      };
      updateRecipe(full);
      return full;
    },
    [user, updateRecipe],
  );

  const deleteRecipe = useCallback(
    async (recipeId: string) => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);
      if (error) throw error;
      removeRecipe(recipeId);
    },
    [removeRecipe],
  );

  const applyIngredientSwap = useCallback(
    async (
      recipeId: string,
      ingredientId: string,
      newName: string,
      newPreparation: string,
    ): Promise<RecipeWithIngredients> => {
      const supabase = getSupabase();
      await supabase
        .from("recipe_ingredients")
        .update({ name: newName, preparation: newPreparation })
        .eq("id", ingredientId);

      // Re-fetch recipe to get updated state
      const { data, error } = await supabase
        .from("recipes")
        .select("*, recipe_ingredients(*)")
        .eq("id", recipeId)
        .single();
      if (error) throw error;
      const full = data as RecipeWithIngredients;
      updateRecipe(full);
      return full;
    },
    [updateRecipe],
  );

  return {
    recipes,
    isLoading,
    analyses,
    fetchRecipes,
    createRecipe,
    editRecipe,
    deleteRecipe,
    applyIngredientSwap,
  };
}
