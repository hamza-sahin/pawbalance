# AI Food Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users ask about any food's safety for their dog via AI, integrated into the existing search flow with Pro tier gating.

**Architecture:** New `/api/foods/ask` SSE endpoint reuses the existing agent factory (`createRecipeAgent`) with a food-ask mode. A new `useAIFoodLookup` hook consumes the stream. An inline AI suggestion row sits atop search results, gated by `guardAction("foods.ai_ask")`. The existing FoodDetail page gains an AI code path with badge and personalized section.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS 4, Zustand, Supabase, next-intl, `@mariozechner/pi-agent-core`, Lucide icons, Zod

---

### Task 1: Add `AIFoodResult` type and `foods.ai_ask` entitlement

**Files:**
- Modify: `src/lib/types.ts:173` (after `RecipeAnalysis` interface)
- Modify: `src/lib/entitlements.ts:7` (add new action)

- [ ] **Step 1: Add `AIFoodResult` type to `src/lib/types.ts`**

Add after the `RecipeAnalysis` interface (line 173):

```typescript
/* ── AI Food Search ─────────────────────────────────── */

export interface AIFoodPersonalized {
  pet_name: string;
  pet_specific_advice: string;
  portion_guidance: string;
  risk_factors: string[];
}

export interface AIFoodResult {
  name: string;
  category: string;
  safety_level: "SAFE" | "MODERATE" | "TOXIC";
  dangerous_parts: string | null;
  preparation: string | null;
  benefits: string | null;
  warnings: string | null;
  personalized: AIFoodPersonalized | null;
  ai_generated: true;
}
```

- [ ] **Step 2: Add entitlement to `src/lib/entitlements.ts`**

Add `"foods.ai_ask": "basic"` to the `ACTION_ENTITLEMENTS` object:

```typescript
export const ACTION_ENTITLEMENTS: Record<string, AccessTier> = {
  "recipes.read": "free",
  "recipes.create": "basic",
  "recipes.edit": "basic",
  "recipes.analyze": "basic",
  "foods.ai_ask": "basic",
  "scanner.scan": "premium",
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/entitlements.ts
git commit -m "feat: add AIFoodResult type and foods.ai_ask entitlement"
```

---

### Task 2: Add food-ask mode to agent system prompt

**Files:**
- Modify: `src/lib/agent/system-prompt.ts`
- Modify: `src/lib/agent/create-agent.ts`

- [ ] **Step 1: Add `buildFoodAskSystemPrompt` to `src/lib/agent/system-prompt.ts`**

Add this new function after `buildSystemPrompt`:

```typescript
export function buildFoodAskSystemPrompt(locale: string): string {
  const lang = locale === "tr" ? "Turkish" : "English";

  return `You are an expert canine nutritionist AI assistant for the PawBalance app. Your role is to assess whether a specific food is safe for dogs and provide personalized advice.

## Instructions

1. Call the lookup_food tool to check the food against the safety database.
2. If a pet_id is provided, call the get_pet_profile tool to personalize your advice.
3. Call the search_knowledge_base tool to get deeper veterinary nutrition insights about this food. Query in English regardless of the user's language.
4. After gathering all information, produce your assessment.

## Output Format

You MUST respond with a single JSON object (no markdown, no code fences, no explanation outside the JSON). The schema:

{
  "name": "Food name as provided by the user",
  "category": "Food category (e.g. Fruit, Vegetable, Grain, Meat, Dairy, etc.)",
  "safety_level": "SAFE" | "MODERATE" | "TOXIC",
  "dangerous_parts": "Description of dangerous parts, or null if none",
  "preparation": "How to safely prepare this food for dogs, or null if no special preparation needed",
  "benefits": "Bullet-separated list of benefits (use • as separator), or null if none",
  "warnings": "Bullet-separated list of warnings (use • as separator), or null if none",
  "personalized": {
    "pet_name": "The dog's name",
    "pet_specific_advice": "2-3 sentences of advice specific to this dog's breed, age, weight, and health",
    "portion_guidance": "Specific portion recommendation for this dog's size and weight",
    "risk_factors": ["Array of risk factors specific to this dog, e.g. 'young age', 'sensitive breed'"]
  },
  "ai_generated": true
}

## Rules

- If the food is found in the database, use that data as the foundation and enrich it with AI analysis and personalization.
- If the food is NOT in the database, generate the full assessment from your veterinary nutrition knowledge. Be conservative — if unsure about safety, mark as "MODERATE".
- The "personalized" field should be null if no pet profile was provided. If a pet profile is available, always include personalized advice.
- All text in the JSON MUST be in ${lang}.
- Keep all text concise but actionable.
- Use bullet separator • for benefits and warnings lists to match the database format.`;
}
```

- [ ] **Step 2: Add `mode` parameter to `createRecipeAgent` in `src/lib/agent/create-agent.ts`**

Update the options interface and factory function:

Change the interface from:
```typescript
interface CreateRecipeAgentOptions {
  locale: string;
  supabaseUrl: string;
  supabaseKey: string;
}
```

To:
```typescript
interface CreateAgentOptions {
  mode: "recipe" | "food-ask";
  locale: string;
  supabaseUrl: string;
  supabaseKey: string;
}
```

Update the import to include `buildFoodAskSystemPrompt`:
```typescript
import { buildSystemPrompt, buildFoodAskSystemPrompt } from "./system-prompt";
```

Update the function signature and system prompt selection:
```typescript
export function createRecipeAgent({
  mode,
  locale,
  supabaseUrl,
  supabaseKey,
}: CreateAgentOptions): Agent {
```

Replace the `systemPrompt` line inside the `Agent` constructor:
```typescript
    initialState: {
      systemPrompt: mode === "food-ask"
        ? buildFoodAskSystemPrompt(locale)
        : buildSystemPrompt(locale),
```

- [ ] **Step 3: Update the recipe analysis route to pass `mode: "recipe"`**

In `src/app/api/recipes/analyze/route.ts`, update the agent creation call (around line 92):

Change:
```typescript
  const agent = createRecipeAgent({
    locale: locale || "en",
    supabaseUrl,
    supabaseKey,
  });
```

To:
```typescript
  const agent = createRecipeAgent({
    mode: "recipe",
    locale: locale || "en",
    supabaseUrl,
    supabaseKey,
  });
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/agent/system-prompt.ts src/lib/agent/create-agent.ts src/app/api/recipes/analyze/route.ts
git commit -m "feat: add food-ask mode to agent system prompt and factory"
```

---

### Task 3: Create `/api/foods/ask` SSE endpoint

**Files:**
- Create: `src/app/api/foods/ask/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/foods/ask/route.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { createRecipeAgent } from "@/lib/agent/create-agent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  // 1. Parse request
  const { query, petId, locale } = await request.json();
  if (!query || typeof query !== "string") {
    return Response.json(
      { error: "query is required" },
      { status: 400, headers: corsHeaders },
    );
  }

  // 2. Validate auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // 3. Check subscription tier
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tier = user?.user_metadata?.subscription_tier ?? "FREE";
  if (tier !== "BASIC" && tier !== "PREMIUM") {
    return Response.json(
      { error: "subscription_required", required: "basic" },
      { status: 403, headers: corsHeaders },
    );
  }

  // 4. Build user message
  const userMessage = `Assess this food for dogs:

Food: "${query}"
${petId ? `Pet ID: ${petId}` : "No specific pet selected."}

Look up the food in the safety database, research it, and provide your assessment.`;

  // 5. Create agent in food-ask mode
  const agent = createRecipeAgent({
    mode: "food-ask",
    locale: locale || "en",
    supabaseUrl,
    supabaseKey,
  });

  // 6. SSE streaming
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      // Send initial status
      send("status", { phase: "looking_up" });

      // Subscribe to agent events
      agent.subscribe((event) => {
        if (event.type === "tool_execution_start") {
          send("tool_start", {
            toolName: event.toolName,
            args: event.args,
          });
        }
        if (event.type === "tool_execution_end") {
          send("tool_end", {
            toolName: event.toolName,
            isError: event.isError,
            result: event.result,
          });
        }
      });

      try {
        await agent.prompt(userMessage);

        const messages = agent.state.messages;
        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");

        let resultJson = null;
        if (lastAssistant && "content" in lastAssistant) {
          const textContent = (lastAssistant.content as any[]).find(
            (c: any) => c.type === "text",
          );
          if (textContent) {
            try {
              let text = textContent.text.trim();
              if (text.startsWith("```")) {
                text = text
                  .replace(/^```(?:json)?\n?/, "")
                  .replace(/\n?```$/, "");
              }
              resultJson = JSON.parse(text);
            } catch {
              // Agent didn't return valid JSON
            }
          }
        }

        if (resultJson) {
          send("result", resultJson);
        } else {
          send("error", { message: "Agent did not return valid JSON" });
        }
      } catch (err) {
        send("error", {
          message:
            err instanceof Error ? err.message : "Analysis failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/foods/ask/route.ts
git commit -m "feat: add /api/foods/ask SSE endpoint"
```

---

### Task 4: Create `useAIFoodLookup` hook

**Files:**
- Create: `src/hooks/use-ai-food-lookup.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/use-ai-food-lookup.ts`:

```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import { getApiUrl } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { AIFoodResult } from "@/lib/types";

export type AIFoodStatus = "idle" | "loading" | "done" | "error";

export function useAIFoodLookup() {
  const { session } = useAuthStore();
  const [status, setStatus] = useState<AIFoodStatus>("idle");
  const [result, setResult] = useState<AIFoodResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const lookup = useCallback(
    async (query: string, petId: string | null, locale: string) => {
      if (!session?.access_token) return;

      setStatus("loading");
      setResult(null);
      setError(null);
      setStatusText(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(getApiUrl("/api/foods/ask"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query, petId, locale }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              const remainingLines = buffer.split("\n");
              for (const line of remainingLines) {
                if (line.startsWith("event: ")) {
                  currentEvent = line.slice(7);
                } else if (line.startsWith("data: ") && currentEvent) {
                  const data = JSON.parse(line.slice(6));
                  handleEvent(currentEvent, data);
                  currentEvent = "";
                }
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7);
            } else if (line.startsWith("data: ") && currentEvent) {
              const data = JSON.parse(line.slice(6));
              handleEvent(currentEvent, data);
              currentEvent = "";
            }
          }
        }

        // If we finished the stream without getting a result, mark as error
        setStatus((prev) => (prev === "loading" ? "error" : prev));
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setStatus("error");
          setError(
            err instanceof Error ? err.message : "Analysis failed",
          );
        }
      }
    },
    [session],
  );

  const handleEvent = (event: string, data: any) => {
    switch (event) {
      case "status":
        setStatusText(data.phase === "looking_up" ? "looking_up" : null);
        break;
      case "tool_start":
        if (data.toolName === "lookup_food") {
          setStatusText("checking_database");
        }
        break;
      case "tool_end":
        setStatusText(null);
        break;
      case "result":
        setStatus("done");
        setResult(data as AIFoodResult);
        break;
      case "error":
        setStatus("error");
        setError(data.message);
        break;
    }
  };

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  return { status, result, error, statusText, lookup, abort };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-ai-food-lookup.ts
git commit -m "feat: add useAIFoodLookup SSE client hook"
```

---

### Task 5: Add `Sparkles` icon to Icons registry

**Files:**
- Modify: `src/components/ui/icon.tsx`

- [ ] **Step 1: Add Sparkles import and registry entry**

Add `Sparkles` to the import list in `src/components/ui/icon.tsx`. In the import block (around line 1), add `Sparkles` alphabetically:

```typescript
import {
  Apple,
  ArrowLeft,
  // ... existing imports ...
  Share2,
  Shield,
  ShieldCheck,
  Skull,
  Sparkles,
  Sprout,
  // ... rest ...
} from "lucide-react";
```

Add to the `Icons` object, in the "Misc" section (after `skull: Skull`):

```typescript
  skull: Skull,
  sparkles: Sparkles,
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/icon.tsx
git commit -m "feat: add Sparkles icon to icon registry"
```

---

### Task 6: Add i18n keys

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add English keys to `src/messages/en.json`**

Add before the closing `}` of the file:

```json
  "aiSuggestionLabel": "Is {food} safe for {petName}?",
  "aiSuggestionGeneric": "Is {food} safe for dogs?",
  "aiGeneratedBadge": "AI",
  "personalizedFor": "Personalized for {petName}",
  "portionGuidance": "Portion Guidance",
  "riskFactors": "Risk Factors",
  "petSpecificAdvice": "Pet-Specific Advice",
  "aiAnalyzing": "Analyzing...",
  "aiCheckingDatabase": "Checking database...",
  "aiError": "AI analysis failed. Please try again.",
  "proRequired": "Pro"
```

- [ ] **Step 2: Add Turkish keys to `src/messages/tr.json`**

Add the same keys with Turkish translations before the closing `}`:

```json
  "aiSuggestionLabel": "{food} {petName} için güvenli mi?",
  "aiSuggestionGeneric": "{food} köpekler için güvenli mi?",
  "aiGeneratedBadge": "AI",
  "personalizedFor": "{petName} için kişiselleştirildi",
  "portionGuidance": "Porsiyon Rehberi",
  "riskFactors": "Risk Faktörleri",
  "petSpecificAdvice": "Özel Tavsiyeler",
  "aiAnalyzing": "Analiz ediliyor...",
  "aiCheckingDatabase": "Veritabanı kontrol ediliyor...",
  "aiError": "AI analizi başarısız oldu. Lütfen tekrar deneyin.",
  "proRequired": "Pro"
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/en.json src/messages/tr.json
git commit -m "i18n: add AI food search translation keys"
```

---

### Task 7: Create `AISuggestionRow` component

**Files:**
- Create: `src/components/food/ai-suggestion-row.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/food/ai-suggestion-row.tsx`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEntitlement } from "@/hooks/use-entitlement";
import { usePetStore } from "@/store/pet-store";
import { useAuthStore } from "@/store/auth-store";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
import { Icons } from "@/components/ui/icon";

interface AISuggestionRowProps {
  query: string;
}

export function AISuggestionRow({ query }: AISuggestionRowProps) {
  const t = useTranslations();
  const router = useRouter();
  const { session } = useAuthStore();
  const { guardAction, isPaywallOpen, paywallTier, dismissPaywall } =
    useEntitlement();

  const selectedPet = usePetStore((s) => {
    const id = s.selectedPetId;
    return s.pets.find((p) => p.id === id) ?? null;
  });

  const handleTap = () => {
    // Unauthenticated users can't use AI — don't show paywall, just ignore
    if (!session) return;

    if (!guardAction("foods.ai_ask")) return;

    // Pro user — navigate to AI food detail
    const params = new URLSearchParams({ ai: "true", query });
    if (selectedPet) params.set("petId", selectedPet.id);
    router.push(`/search/food?${params.toString()}`);
  };

  return (
    <>
      <button
        onClick={handleTap}
        className="flex w-full cursor-pointer items-center gap-3 rounded-card border border-primary/20 bg-primary/5 p-3 text-left transition-all duration-150 ease-out hover:bg-primary/10 active:scale-[0.98] active:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icons.sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-txt">
            {selectedPet
              ? t("aiSuggestionLabel", {
                  food: query,
                  petName: selectedPet.name,
                })
              : t("aiSuggestionGeneric", { food: query })}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {t("proRequired")}
        </span>
        <Icons.chevronRight
          className="h-4 w-4 text-txt-tertiary"
          aria-hidden="true"
        />
      </button>

      {isPaywallOpen && paywallTier && (
        <PaywallSheet
          requiredTier={paywallTier}
          onDismiss={dismissPaywall}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/food/ai-suggestion-row.tsx
git commit -m "feat: add AISuggestionRow component"
```

---

### Task 8: Integrate AI suggestion row into search page

**Files:**
- Modify: `src/app/(app)/search/page.tsx`

- [ ] **Step 1: Add import**

Add to the imports at the top of `src/app/(app)/search/page.tsx`:

```typescript
import { AISuggestionRow } from "@/components/food/ai-suggestion-row";
```

- [ ] **Step 2: Add AI suggestion row above results**

In the search results section, add the `AISuggestionRow` above the results count and results list. Replace the block starting at line 97 (`{hasQuery ? (`) through the closing of that branch.

Replace:
```typescript
      {hasQuery ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-txt-secondary">
            {t("resultsFor", { count: results.length, query })}
          </p>
          {isSearching ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : results.length > 0 ? (
            results.map((food) => <FoodCard key={food.id} food={food} />)
          ) : (
            <div className="flex flex-col gap-4">
              <EmptyState
                icon="searchX"
                title={t("noResults")}
                subtitle={t("noResultsSubtitle")}
                action={{
                  label: t("browseCategories"),
                  onClick: () => { setQuery(""); clearSearch(); },
                }}
              />
              <button
                onClick={() => setShowRequestDialog(true)}
                className="mx-auto min-h-[44px] inline-flex items-center rounded-button px-4 text-sm font-medium text-primary transition-all duration-150 ease-out hover:bg-primary/5 active:scale-95 active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t("requestFood")}
              </button>
            </div>
          )}
        </div>
```

With:
```typescript
      {hasQuery ? (
        <div className="flex flex-col gap-3">
          {/* AI suggestion row — always at top */}
          {!isSearching && <AISuggestionRow query={query} />}

          <p className="text-sm text-txt-secondary">
            {t("resultsFor", { count: results.length, query })}
          </p>
          {isSearching ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : results.length > 0 ? (
            results.map((food) => <FoodCard key={food.id} food={food} />)
          ) : (
            <div className="flex flex-col gap-4">
              <EmptyState
                icon="searchX"
                title={t("noResults")}
                subtitle={t("noResultsSubtitle")}
                action={{
                  label: t("browseCategories"),
                  onClick: () => { setQuery(""); clearSearch(); },
                }}
              />
              <button
                onClick={() => setShowRequestDialog(true)}
                className="mx-auto min-h-[44px] inline-flex items-center rounded-button px-4 text-sm font-medium text-primary transition-all duration-150 ease-out hover:bg-primary/5 active:scale-95 active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t("requestFood")}
              </button>
            </div>
          )}
        </div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/page.tsx
git commit -m "feat: integrate AI suggestion row into search page"
```

---

### Task 9: Add AI code path to FoodDetail page

**Files:**
- Modify: `src/app/(app)/search/food/page.tsx`

- [ ] **Step 1: Rewrite the FoodDetail page to support both DB and AI paths**

Replace the entire content of `src/app/(app)/search/food/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useFoodDetail } from "@/hooks/use-food-search";
import { useAIFoodLookup } from "@/hooks/use-ai-food-lookup";
import { usePetStore } from "@/store/pet-store";
import { SafetyBadge } from "@/components/food/safety-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { localise, splitBullets } from "@/lib/types";
import type { AIFoodResult } from "@/lib/types";
import { Icons } from "@/components/ui/icon";
import { AddToRecipeSheet } from "@/components/food/add-to-recipe-sheet";

function FoodDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="mx-auto h-20 w-20 rounded-full" />
      <Skeleton className="mx-auto h-6 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function AIBadge() {
  const t = useTranslations();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      <Icons.sparkles className="h-3 w-3" aria-hidden="true" />
      {t("aiGeneratedBadge")}
    </span>
  );
}

function PersonalizedSection({ personalized }: { personalized: AIFoodResult["personalized"] }) {
  const t = useTranslations();
  if (!personalized) return null;

  const selectedPet = usePetStore((s) => {
    const id = s.selectedPetId;
    return s.pets.find((p) => p.id === id) ?? null;
  });

  return (
    <section className="rounded-card border border-primary/20 bg-primary/5 p-4">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-primary">
        {selectedPet?.avatar_url ? (
          <img
            src={selectedPet.avatar_url}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <Icons.paw className="h-5 w-5" aria-hidden="true" />
        )}
        {t("personalizedFor", { petName: personalized.pet_name })}
      </h2>

      <div className="flex flex-col gap-3">
        {/* Pet-specific advice */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary/70">
            {t("petSpecificAdvice")}
          </p>
          <p className="text-sm text-txt-secondary">
            {personalized.pet_specific_advice}
          </p>
        </div>

        {/* Portion guidance */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary/70">
            {t("portionGuidance")}
          </p>
          <p className="text-sm text-txt-secondary">
            {personalized.portion_guidance}
          </p>
        </div>

        {/* Risk factors */}
        {personalized.risk_factors.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary/70">
              {t("riskFactors")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {personalized.risk_factors.map((factor, i) => (
                <span
                  key={i}
                  className="rounded-full bg-caution/10 px-2.5 py-0.5 text-xs font-medium text-caution"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function FoodDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();

  // Detect mode: AI vs DB
  const isAI = searchParams.get("ai") === "true";
  const id = searchParams.get("id") ?? "";
  const aiQuery = searchParams.get("query") ?? "";
  const aiPetId = searchParams.get("petId") ?? null;

  // DB path
  const { food, isLoading: dbLoading, fetchFood } = useFoodDetail();

  // AI path
  const {
    status: aiStatus,
    result: aiResult,
    error: aiError,
    statusText,
    lookup,
    abort,
  } = useAIFoodLookup();

  const [showRecipeSheet, setShowRecipeSheet] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");

  // Fetch on mount
  useEffect(() => {
    if (isAI && aiQuery) {
      lookup(aiQuery, aiPetId, locale);
    } else if (id) {
      fetchFood(id);
    }
    return () => {
      if (isAI) abort();
    };
  }, [isAI, id, aiQuery, aiPetId, locale, fetchFood, lookup, abort]);

  // Loading state
  if (isAI && aiStatus === "loading") {
    return (
      <div className="p-4">
        <Link
          href="/search"
          aria-label="Back"
          className="mb-4 inline-flex min-h-[44px] min-w-[44px] items-center text-txt-secondary transition-opacity duration-150 hover:text-txt active:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg"
        >
          <Icons.arrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <FoodDetailSkeleton />
        {statusText && (
          <p className="mt-4 text-center text-sm text-txt-secondary motion-safe:animate-pulse">
            {statusText === "checking_database"
              ? t("aiCheckingDatabase")
              : t("aiAnalyzing")}
          </p>
        )}
      </div>
    );
  }

  // AI error state
  if (isAI && aiStatus === "error") {
    return (
      <div className="p-4">
        <Link
          href="/search"
          aria-label="Back"
          className="mb-4 inline-flex min-h-[44px] min-w-[44px] items-center text-txt-secondary transition-opacity duration-150 hover:text-txt active:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg"
        >
          <Icons.arrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="flex flex-col items-center gap-3 py-12">
          <Icons.caution className="h-10 w-10 text-caution" aria-hidden="true" />
          <p className="text-center text-sm text-txt-secondary">
            {aiError ?? t("aiError")}
          </p>
          <button
            onClick={() => lookup(aiQuery, aiPetId, locale)}
            className="min-h-[44px] rounded-button bg-primary-btn px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 active:scale-95"
          >
            {t("tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  // DB loading
  if (!isAI && (dbLoading || !food)) {
    return <FoodDetailSkeleton />;
  }

  // Derive display values based on mode
  const name = isAI ? aiResult!.name : localise(food!, "name", locale);
  const category = isAI
    ? aiResult!.category
    : localise(food!, "category", locale);
  const safetyLevel = isAI ? aiResult!.safety_level : food!.safety_level;
  const dangerousParts = isAI
    ? aiResult!.dangerous_parts
    : localise(food!, "dangerous_parts", locale);
  const preparation = isAI
    ? aiResult!.preparation
    : localise(food!, "preparation", locale);
  const benefits = splitBullets(
    isAI ? aiResult!.benefits : localise(food!, "benefits", locale),
  );
  const warnings = splitBullets(
    isAI ? aiResult!.warnings : localise(food!, "warnings", locale),
  );
  const categoryInitial = isAI
    ? aiResult!.category.charAt(0)
    : food!.category_en.charAt(0);

  return (
    <div className="p-4">
      <Link
        href="/search"
        aria-label="Back"
        className="mb-4 inline-flex min-h-[44px] min-w-[44px] items-center text-txt-secondary transition-opacity duration-150 hover:text-txt active:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg"
      >
        <Icons.arrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>

      <div className="mb-6 flex flex-col items-center gap-2">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary"
          aria-hidden="true"
        >
          {categoryInitial}
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-txt">{name}</h1>
          {isAI && <AIBadge />}
        </div>
        <SafetyBadge level={safetyLevel} />
        <p className="text-sm text-txt-secondary">{category}</p>
      </div>

      <div className="flex flex-col gap-4">
        {dangerousParts && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-toxic">
              <Icons.dangerousParts
                className="h-5 w-5"
                aria-hidden="true"
              />{" "}
              {t("dangerousParts")}
            </h2>
            <p className="text-sm text-txt-secondary">{dangerousParts}</p>
          </section>
        )}

        {preparation && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-caution">
              <Icons.preparation
                className="h-5 w-5"
                aria-hidden="true"
              />{" "}
              {t("preparation")}
            </h2>
            <p className="text-sm text-txt-secondary">{preparation}</p>
          </section>
        )}

        {warnings.length > 0 && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-warning">
              <Icons.warnings
                className="h-5 w-5"
                aria-hidden="true"
              />{" "}
              {t("warnings")}
            </h2>
            <ul className="flex flex-col gap-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-txt-secondary">
                  • {w}
                </li>
              ))}
            </ul>
          </section>
        )}

        {benefits.length > 0 && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-success">
              <Icons.benefits
                className="h-5 w-5"
                aria-hidden="true"
              />{" "}
              {t("benefits")}
            </h2>
            <ul className="flex flex-col gap-1">
              {benefits.map((b, i) => (
                <li key={i} className="text-sm text-txt-secondary">
                  • {b}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Personalized section — AI only */}
        {isAI && aiResult?.personalized && (
          <PersonalizedSection personalized={aiResult.personalized} />
        )}
      </div>

      {/* Action bar */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setShowRecipeSheet(true)}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-button bg-primary-btn px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-out active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Icons.plus className="h-4 w-4" aria-hidden="true" />
          {t("addToRecipe")}
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: name,
                text: `${name} - ${t(safetyLevel === "SAFE" ? "safe" : safetyLevel === "MODERATE" ? "caution" : "toxic")}`,
              });
            }
          }}
          aria-label={t("share")}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-button border border-border bg-surface transition-all duration-150 ease-out active:scale-90 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icons.share
            className="h-5 w-5 text-txt-secondary"
            aria-hidden="true"
          />
        </button>
      </div>

      {addedMessage && (
        <div className="mt-3 rounded-button bg-safe/10 px-4 py-2.5 text-center text-sm font-medium text-safe">
          {addedMessage}
        </div>
      )}

      <AddToRecipeSheet
        open={showRecipeSheet}
        onClose={() => setShowRecipeSheet(false)}
        foodName={name}
        preparation={
          isAI
            ? aiResult?.preparation ?? undefined
            : localise(food!, "preparation", locale) || undefined
        }
        onAdded={(recipeName) => {
          setAddedMessage(
            t("addedToRecipe", { food: name, recipe: recipeName }),
          );
          setTimeout(() => setAddedMessage(""), 3000);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/search/food/page.tsx
git commit -m "feat: add AI code path to FoodDetail page with badge and personalized section"
```

---

### Task 10: Verify build

**Files:** None (verification only)

- [ ] **Step 1: Run static build to verify no type errors**

```bash
npm run build
```

Expected: Build succeeds. The `/api/foods/ask` route will be skipped in static export mode (POST-only handler, compatible with `output: 'export'`). No type errors.

- [ ] **Step 2: Run server mode build to verify API route compiles**

```bash
BUILD_MODE=server npm run build
```

Expected: Build succeeds including API route compilation.

- [ ] **Step 3: Commit any fixes if needed**

If build reveals issues, fix them and commit:
```bash
git add -A
git commit -m "fix: resolve build issues from AI food search integration"
```
