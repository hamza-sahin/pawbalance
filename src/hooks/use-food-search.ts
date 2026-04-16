"use client";

import { useState, useCallback, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useFoodStore } from "@/store/food-store";
import type { Food, FoodCategory } from "@/lib/types";

const CATEGORY_STALE_MS = 5 * 60 * 1000; // 5 minutes
const FOODS_STALE_MS = 5 * 60 * 1000;
const DETAIL_STALE_MS = 10 * 60 * 1000;

export function useFoodSearch() {
  const { lastSearch, setLastSearch, clearLastSearch } = useFoodStore();
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      clearLastSearch();
      return;
    }
    setIsSearching(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("search_foods", {
      search_query: query,
    });
    if (error) throw error;
    const results = (data as Food[]) ?? [];
    setLastSearch(query, results);
    setIsSearching(false);
  }, [setLastSearch, clearLastSearch]);

  const clearSearch = useCallback(() => clearLastSearch(), [clearLastSearch]);

  return {
    results: lastSearch?.results ?? [],
    isSearching,
    search,
    clearSearch,
    lastQuery: lastSearch?.query ?? "",
  };
}

export function useSimilarFoods() {
  const [similar, setSimilar] = useState<Food[]>([]);

  const fetchSimilar = useCallback(async (query: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("get_similar_foods", {
      search_query: query,
      limit_count: 5,
    });
    if (error) throw error;
    setSimilar((data as Food[]) ?? []);
  }, []);

  return { similar, fetchSimilar };
}

export function useCategories() {
  const { categories, categoriesLoadedAt, setCategories } = useFoodStore();

  const isStale =
    !categoriesLoadedAt || Date.now() - categoriesLoadedAt > CATEGORY_STALE_MS;
  const isLoading = categories.length === 0;

  const fetchCategories = useCallback(async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("food_categories")
      .select("id, name_en, name_tr, food_count");
    if (error) throw error;
    setCategories((data as FoodCategory[]) ?? []);
  }, [setCategories]);

  useEffect(() => {
    if (isStale) fetchCategories();
  }, [isStale, fetchCategories]);

  return { categories, isLoading, fetchCategories };
}

export function useFoodsByCategory() {
  const { foodsByCategory, setFoodsByCategory } = useFoodStore();
  const [activeCategory, setActiveCategory] = useState<string>("");

  const cached = activeCategory ? foodsByCategory[activeCategory] : null;
  const isLoading = activeCategory !== "" && !cached;

  const fetchByCategory = useCallback(
    async (categoryEn: string) => {
      setActiveCategory(categoryEn);
      const existing = useFoodStore.getState().foodsByCategory[categoryEn];
      if (existing && Date.now() - existing.loadedAt < FOODS_STALE_MS) return;

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("category_en", categoryEn)
        .order("name_en");
      if (error) throw error;
      setFoodsByCategory(categoryEn, (data as Food[]) ?? []);
    },
    [setFoodsByCategory],
  );

  return {
    foods: cached?.foods ?? [],
    isLoading,
    fetchByCategory,
  };
}

export function useFoodDetail() {
  const { foodDetails, setFoodDetail } = useFoodStore();
  const [activeId, setActiveId] = useState<string>("");

  const cached = activeId ? foodDetails[activeId] : null;
  const isLoading = activeId !== "" && !cached;

  const fetchFood = useCallback(
    async (id: string) => {
      setActiveId(id);
      const existing = useFoodStore.getState().foodDetails[id];
      if (existing && Date.now() - existing.loadedAt < DETAIL_STALE_MS) return;

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setFoodDetail(id, data as Food);
    },
    [setFoodDetail],
  );

  return {
    food: cached?.food ?? null,
    isLoading,
    fetchFood,
  };
}

export function useFoodRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = useCallback(async (foodName: string) => {
    setIsSubmitting(true);
    const supabase = getSupabase();
    const { error } = await supabase
      .from("food_requests")
      .insert({ food_name: foodName });
    setIsSubmitting(false);
    if (error) throw error;
  }, []);

  return { isSubmitting, submitRequest };
}
