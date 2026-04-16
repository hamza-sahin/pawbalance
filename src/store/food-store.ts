// src/store/food-store.ts
"use client";

import { create } from "zustand";
import type { Food, FoodCategory, AIFoodResult } from "@/lib/types";

export type AIFoodStatus = "idle" | "loading" | "done" | "error";

interface FoodState {
  // Categories
  categories: FoodCategory[];
  categoriesLoadedAt: number | null;
  setCategories: (cats: FoodCategory[]) => void;

  // Foods by category (keyed by category_en name)
  foodsByCategory: Record<string, { foods: Food[]; loadedAt: number }>;
  setFoodsByCategory: (category: string, foods: Food[]) => void;

  // Food details (keyed by food ID)
  foodDetails: Record<string, { food: Food; loadedAt: number }>;
  setFoodDetail: (id: string, food: Food) => void;

  // Search cache (preserve last search for back-navigation)
  lastSearch: { query: string; results: Food[] } | null;
  setLastSearch: (query: string, results: Food[]) => void;
  clearLastSearch: () => void;

  // AI food lookup (survives navigation)
  aiLookup: {
    query: string;
    petId: string | null;
    status: AIFoodStatus;
    statusText: string | null;
    result: AIFoodResult | null;
    error: string | null;
  } | null;
  setAILookup: (lookup: FoodState["aiLookup"]) => void;
  updateAILookup: (patch: Partial<NonNullable<FoodState["aiLookup"]>>) => void;
}

export const useFoodStore = create<FoodState>((set) => ({
  categories: [],
  categoriesLoadedAt: null,
  setCategories: (categories) =>
    set({ categories, categoriesLoadedAt: Date.now() }),

  foodsByCategory: {},
  setFoodsByCategory: (category, foods) =>
    set((s) => ({
      foodsByCategory: {
        ...s.foodsByCategory,
        [category]: { foods, loadedAt: Date.now() },
      },
    })),

  foodDetails: {},
  setFoodDetail: (id, food) =>
    set((s) => ({
      foodDetails: {
        ...s.foodDetails,
        [id]: { food, loadedAt: Date.now() },
      },
    })),

  lastSearch: null,
  setLastSearch: (query, results) => set({ lastSearch: { query, results } }),
  clearLastSearch: () => set({ lastSearch: null }),

  aiLookup: null,
  setAILookup: (aiLookup) => set({ aiLookup }),
  updateAILookup: (patch) =>
    set((s) => ({
      aiLookup: s.aiLookup ? { ...s.aiLookup, ...patch } : null,
    })),
}));
