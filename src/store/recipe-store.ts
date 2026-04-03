"use client";

import { create } from "zustand";
import type { RecipeWithIngredients, RecipeAnalysis } from "@/lib/types";

interface RecipeState {
  recipes: RecipeWithIngredients[];
  isLoading: boolean;
  setRecipes: (recipes: RecipeWithIngredients[]) => void;
  addRecipe: (recipe: RecipeWithIngredients) => void;
  updateRecipe: (recipe: RecipeWithIngredients) => void;
  removeRecipe: (id: string) => void;
  setLoading: (loading: boolean) => void;

  // Latest analysis per recipe
  analyses: Record<string, RecipeAnalysis>;
  setAnalysis: (recipeId: string, analysis: RecipeAnalysis) => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipes: [],
  isLoading: false,
  setRecipes: (recipes) => set({ recipes }),
  addRecipe: (recipe) =>
    set((state) => ({ recipes: [...state.recipes, recipe] })),
  updateRecipe: (recipe) =>
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
    })),
  removeRecipe: (id) =>
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),

  analyses: {},
  setAnalysis: (recipeId, analysis) =>
    set((state) => ({
      analyses: { ...state.analyses, [recipeId]: analysis },
    })),
}));
