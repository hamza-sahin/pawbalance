"use client";

import { useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Food, FoodCategory } from "@/lib/types";

export function useFoodSearch() {
  const [results, setResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("search_foods", {
      search_query: query,
    });
    if (error) throw error;
    setResults((data as Food[]) ?? []);
    setIsSearching(false);
  }, []);

  const clearSearch = useCallback(() => setResults([]), []);

  return { results, isSearching, search, clearSearch };
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
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("food_categories")
      .select("id, name_en, name_tr, food_count");
    if (error) throw error;
    setCategories((data as FoodCategory[]) ?? []);
    setIsLoading(false);
  }, []);

  return { categories, isLoading, fetchCategories };
}

export function useFoodsByCategory() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchByCategory = useCallback(async (categoryEn: string) => {
    setIsLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .eq("category_en", categoryEn)
      .order("name_en");
    if (error) throw error;
    setFoods((data as Food[]) ?? []);
    setIsLoading(false);
  }, []);

  return { foods, isLoading, fetchByCategory };
}

export function useFoodDetail() {
  const [food, setFood] = useState<Food | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFood = useCallback(async (id: string) => {
    setIsLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    setFood(data as Food);
    setIsLoading(false);
  }, []);

  return { food, isLoading, fetchFood };
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
