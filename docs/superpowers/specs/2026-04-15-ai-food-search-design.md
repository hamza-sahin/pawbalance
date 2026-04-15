# AI Food Search — Design Spec

**Date:** 2026-04-15
**Status:** Approved

## Overview

Add AI-powered food safety lookup to the existing search feature. Users can ask about any food — whether it exists in the database or not — and receive a personalized safety assessment for their dog. The feature is visible to all users but gated behind the Pro (Basic) subscription tier.

## Goals

- Let users search for any food regardless of database coverage
- Provide pet-personalized safety assessments (age, weight, breed-specific advice)
- Seamlessly integrate into existing search UX without disrupting the free experience
- Drive Pro subscription conversions through visible, high-value AI capability

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend | New `/api/foods/ask` endpoint | Dedicated endpoint, clean separation from recipe analysis |
| Agent infra | Reuse `createRecipeAgent` factory with mode parameter | Same tools (lookup_food, get_pet_profile, search_knowledge), different system prompt |
| Streaming | SSE (same as recipe analysis) | Progressive reveal for premium feel, existing pattern in codebase |
| Response shape | Superset of DB Food type + personalized fields | FoodDetail page compatibility, additive personalization |
| Search UX | Inline AI suggestion row at top of results | Always visible, autocomplete-style discovery, no navigation change |
| Result page | Reuse FoodDetail with AI badge + personalized section | Consistent UX, minimal new code |
| Paywall trigger | `guardAction("foods.ai_ask")` on tap | Existing entitlement system, consistent with recipe gating |

## API Endpoint

### `POST /api/foods/ask`

**Request:**
```json
{
  "query": "quinoa",
  "petId": "uuid-or-null",
  "locale": "en"
}
```

**Auth:** Bearer token required. Returns 403 `{ error: "subscription_required", required: "basic" }` if FREE tier.

**Response:** SSE stream with events:

| Event | Payload | Description |
|-------|---------|-------------|
| `status` | `{ "phase": "looking_up" }` | Agent started |
| `tool_start` | `{ "toolName": "lookup_food", "args": {...} }` | Checking DB |
| `tool_end` | `{ "toolName": "lookup_food", "result": {...} }` | DB result (may be empty) |
| `result` | `AIFoodResult` JSON | Final assessment |
| `error` | `{ "message": "..." }` | Failure |

**Implementation:** Mirrors `POST /api/recipes/analyze` structure — auth validation, tier check, agent creation, SSE streaming. Uses `createRecipeAgent({ mode: "food-ask", ... })` instead of recipe mode.

## AI Food Response Shape

```typescript
interface AIFoodResult {
  // Mirror DB Food fields (FoodDetail page compatibility)
  name: string;
  category: string;
  safety_level: "SAFE" | "MODERATE" | "TOXIC";
  dangerous_parts: string | null;
  preparation: string | null;
  benefits: string | null;
  warnings: string | null;

  // AI-only enrichments
  personalized: {
    pet_name: string;
    pet_specific_advice: string;
    portion_guidance: string;
    risk_factors: string[];
  } | null;  // null when no petId provided

  // Metadata
  ai_generated: true;
}
```

## Search UX — Inline AI Suggestion Row

### Placement

Always visible at **top** of search results when query has text (≥ `MIN_SEARCH_LENGTH`). Sits above DB food cards.

### Visual Treatment

- Left accent: gradient border (primary → primary-dark) instead of safety-color border
- Sparkle icon (Lucide `Sparkles`) in primary color
- Text: "Is **[query]** safe for **[pet name]**?" (or "Is **[query]** safe for dogs?" if no pet selected)
- Right side: small "Pro" badge + chevron
- Background: `bg-primary/5` to distinguish from DB cards

### States

| State | Behavior |
|-------|----------|
| Default | Tappable card with Pro badge |
| Free user taps | `guardAction("foods.ai_ask")` → PaywallSheet opens, no navigation |
| Pro user taps | Navigate to `/search/food?ai=true&query=[query]&petId=[petId]` |

### Coexistence with DB Results

If user searches "avocado" and DB has it, both show — AI row on top, DB FoodCard(s) below. User can pick either path.

## FoodDetail Page Changes

### Route

`/search/food?ai=true&query=quinoa&petId=uuid`

### Detection

Page checks `searchParams.ai === "true"`:
- `ai` absent/false: existing DB fetch via `useFoodDetail(id)` — unchanged
- `ai` true: new `useAIFoodLookup(query, petId)` hook fires SSE call

### Progressive Reveal via SSE

1. Page navigates immediately, shows skeleton (same as DB loading)
2. `tool_start` → skeleton stays, optional "Checking database..." status text
3. `tool_end` → safety badge can appear early if DB had a match
4. `result` → full render

### AI Generated Badge

Small chip next to food name: Sparkles icon + "AI" text, `bg-primary/10 text-primary`. Only shows when `ai_generated === true`.

### Personalized Section (Bottom of Page)

- Header: "Personalized for [pet_name]" with pet avatar
- Pet-specific advice paragraph
- Portion guidance
- Risk factors as small warning chips
- Only renders when `result.personalized !== null`

### Action Buttons

Both "Add to Recipe" and "Share" remain for AI results. Recipe ingredients are free text — no DB food ID needed. Share button shares the query URL.

## New Hook — `useAIFoodLookup`

```typescript
// src/hooks/use-ai-food-lookup.ts

interface UseAIFoodLookupReturn {
  status: "idle" | "loading" | "done" | "error";
  result: AIFoodResult | null;
  error: string | null;
  lookup: (query: string, petId: string | null, locale: string) => void;
  abort: () => void;
}
```

Mirrors `useRecipeAnalysis` pattern — SSE reader with `AbortController`. Simpler: no ingredient progress tracking (single food).

SSE events handled:
- `tool_start` / `tool_end` → optional status text updates
- `result` → sets `AIFoodResult`, status → `"done"`
- `error` → sets error message, status → `"error"`

Auto-fires on mount when `ai=true` query param detected.

## Agent System Prompt

Single `createRecipeAgent` factory gains `mode` parameter: `"recipe" | "food-ask"`.

### Food-ask prompt key differences from recipe prompt:

- Analyze single food, not a recipe
- Always call `lookup_food` for the queried food
- Call `get_pet_profile` if petId provided
- Call `search_knowledge` for broader knowledge
- Return `AIFoodResult` JSON schema (not `AnalysisResult`)
- If food found in DB, enrich with AI analysis + personalization
- If food NOT in DB, generate full assessment from knowledge

### User message template:

```
Assess this food for dogs:

Food: "[query]"
${petId ? `Pet ID: ${petId}` : "No specific pet selected."}

Look up the food in the safety database, research it, and provide your assessment.
```

## Entitlements

Add to `ACTION_ENTITLEMENTS` in `src/lib/entitlements.ts`:

```typescript
"foods.ai_ask": "basic",
```

## i18n Keys

New keys for `en.json` / `tr.json`:

| Key | EN Value |
|-----|----------|
| `aiSuggestionLabel` | `"Is {food} safe for {petName}?"` |
| `aiSuggestionGeneric` | `"Is {food} safe for dogs?"` |
| `aiGeneratedBadge` | `"AI"` |
| `personalizedFor` | `"Personalized for {petName}"` |
| `portionGuidance` | `"Portion Guidance"` |
| `riskFactors` | `"Risk Factors"` |
| `petSpecificAdvice` | `"Pet-Specific Advice"` |
| `aiAnalyzing` | `"Analyzing..."` |
| `aiCheckingDatabase` | `"Checking database..."` |
| `aiError` | `"AI analysis failed. Please try again."` |
| `proRequired` | `"Pro"` |

Reuses existing keys for safety, preparation, benefits, warnings sections.

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/foods/ask/route.ts` | **New** — SSE endpoint |
| `src/hooks/use-ai-food-lookup.ts` | **New** — SSE client hook |
| `src/lib/types.ts` | Add `AIFoodResult` type |
| `src/lib/entitlements.ts` | Add `"foods.ai_ask": "basic"` |
| `src/lib/agent/create-agent.ts` | Add `mode` parameter, food-ask system prompt |
| `src/lib/agent/system-prompt.ts` | Add food-ask prompt variant |
| `src/app/(app)/search/page.tsx` | Add AI suggestion row component |
| `src/app/(app)/search/food/page.tsx` | Add AI path detection, `useAIFoodLookup`, badge, personalized section |
| `src/components/food/ai-suggestion-row.tsx` | **New** — sparkle card component |
| `src/messages/en.json` | Add i18n keys |
| `src/messages/tr.json` | Add i18n keys (Turkish translations) |

## Out of Scope

- Caching AI results (can add later if same food queried repeatedly)
- AI food result persistence to database (ephemeral, not stored)
- "Ask follow-up questions" conversational flow
- AI suggestions in category browse view (only in search)
