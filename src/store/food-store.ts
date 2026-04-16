// src/store/food-store.ts
"use client";

import { create } from "zustand";
import type { Food, FoodCategory, AIFoodResult } from "@/lib/types";
import { getApiUrl } from "@/lib/api";

let aiLookupAbortController: AbortController | null = null;

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
    status: AIFoodStatus;
    statusText: string | null;
    result: AIFoodResult | null;
    error: string | null;
  } | null;
  setAILookup: (lookup: FoodState["aiLookup"]) => void;
  updateAILookup: (patch: Partial<NonNullable<FoodState["aiLookup"]>>) => void;
  startAILookup: (query: string, locale: string, accessToken: string) => void;
  abortAILookup: () => void;
}

export const useFoodStore = create<FoodState>((set, get) => ({
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

  startAILookup: (query, locale, accessToken) => {
    aiLookupAbortController?.abort();
    const controller = new AbortController();
    aiLookupAbortController = controller;

    set({
      aiLookup: {
        query,
        status: "loading",
        statusText: null,
        result: null,
        error: null,
      },
    });

    (async () => {
      try {
        const response = await fetch(getApiUrl("/api/foods/ask"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ query, locale }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";

        const processEvent = (event: string, data: any) => {
          const state = get();
          if (state.aiLookup?.query !== query) return;

          switch (event) {
            case "status":
              state.updateAILookup({
                statusText: data.phase === "looking_up" ? "looking_up" : null,
              });
              break;
            case "tool_start":
              if (data.toolName === "lookup_food") {
                state.updateAILookup({ statusText: "checking_database" });
              }
              break;
            case "tool_end":
              state.updateAILookup({ statusText: null });
              break;
            case "result":
              state.updateAILookup({
                status: "done",
                result: data as AIFoodResult,
              });
              break;
            case "error":
              state.updateAILookup({
                status: "error",
                error: data.message,
              });
              break;
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              const lines = buffer.split("\n");
              for (const line of lines) {
                if (line.startsWith("event: ")) currentEvent = line.slice(7);
                else if (line.startsWith("data: ") && currentEvent) {
                  processEvent(currentEvent, JSON.parse(line.slice(6)));
                  currentEvent = "";
                }
              }
            }
            const s = get();
            if (s.aiLookup?.status === "loading") {
              s.updateAILookup({ status: "error" });
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) currentEvent = line.slice(7);
            else if (line.startsWith("data: ") && currentEvent) {
              processEvent(currentEvent, JSON.parse(line.slice(6)));
              currentEvent = "";
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const s = get();
          if (s.aiLookup?.query === query) {
            s.updateAILookup({
              status: "error",
              error: err instanceof Error ? err.message : "Analysis failed",
            });
          }
        }
      }
    })();
  },

  abortAILookup: () => {
    aiLookupAbortController?.abort();
    aiLookupAbortController = null;
    set({ aiLookup: null });
  },
}));
