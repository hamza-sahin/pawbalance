# AI-Powered Recipe Analysis — Design Spec

**Date:** 2026-04-03
**Status:** Approved

## Overview

PawBalance gains a recipe creation and AI-powered analysis feature. Users create dog food recipes by adding ingredients with preparation methods. An AI agent analyzes each recipe against the food safety database and its own knowledge, returning a structured report with safety alerts, preparation warnings, benefits, and actionable follow-up suggestions personalized to the user's dog.

## Architecture

### Dual Build Mode (Single Codebase)

The Next.js app supports two build targets from the same source:

| Target | Build Command | Output | API Routes |
|--------|--------------|--------|------------|
| iOS (Capacitor) | `next build` (default) | `out/` static files | Ignored (POST-only handlers silently skipped) |
| Web (K8s) | `BUILD_MODE=server next build` | `.next/` server bundle | Active — `src/app/api/*` |

`next.config.ts` conditionally sets `output: 'export'` based on `BUILD_MODE` env var. The Capacitor app and the web app both call the same K8s-hosted API routes. A `NEXT_PUBLIC_API_URL` env var tells the client where the API lives.

Confirmed compatible with Next.js 15: POST-only Route Handlers do not cause build errors with `output: 'export'`. They are silently excluded from the static output.

### System Components

```
┌─────────────────────────┐         ┌──────────────────────────────────┐
│  PawBalance Client      │         │  Next.js Server (K8s)            │
│  (Static or Server)     │  HTTPS  │                                  │
│                         │────────►│  POST /api/recipes/analyze       │
│  Recipe Form            │◄────────│  SSE streaming response          │
│  Recipe List            │         │                                  │
│  Analysis Report        │         │  pi-agent-core Agent:            │
│  Follow-Up Actions      │         │  ├─ lookup_food tool (→ Supabase)│
│                         │         │  └─ get_pet_profile tool (→ Supa)│
└─────────────────────────┘         └──────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────────┐         ┌──────────────────────────────────┐
│  Supabase               │         │  Anthropic API (Claude)          │
│  - foods                │         └──────────────────────────────────┘
│  - pets                 │
│  - recipes (new)        │
│  - recipe_ingredients   │
│  - recipe_analyses      │
└─────────────────────────┘
```

### Agent Service

Uses `@mariozechner/pi-agent-core` standalone (not the full coding-agent package). Dependencies:

- `@mariozechner/pi-agent-core` — agent loop, tool execution, hooks
- `@mariozechner/pi-ai` — model abstraction, streaming
- `@sinclair/typebox` — tool parameter schemas

The agent runs inside a Next.js Route Handler (`POST /api/recipes/analyze`). Each request creates a fresh `Agent` instance (stateless per request). No session persistence needed — re-analysis creates a new agent.

### Agent Configuration

**System prompt:** Instructs the agent to act as a canine nutritionist. Specifies:
- Role and behavioral guidelines
- Output JSON schema (structured report + follow-up actions)
- The user's locale (EN/TR) for bilingual responses
- Instructions to generate contextual follow-up actions

**Tools:**

**`lookup_food`**
- Parameters: `{ query: string }`
- Queries the `foods` table via the existing `search_foods` RPC (fuzzy match)
- Returns `content` (summarized text for the model) + `details` (full DB row with safety_level, dangerous_parts, preparation, benefits, warnings)
- If no match found, returns "not in database" — the model falls back to its own knowledge

**`get_pet_profile`**
- Parameters: `{ pet_id: string }`
- Fetches from `pets` table: breed, weight_kg, age_months, activity_level, body_condition_score, gender, is_neutered
- The agent uses this to personalize advice (breed-specific risks, portion-appropriate suggestions, life-stage considerations)

**Hooks:**

- `afterToolCall` — logs tool calls for analytics (which ingredients are looked up, DB hit rate)
- `transformContext` — injects pet profile context before each LLM request

**Execution:** Tool calls execute in parallel. When a recipe has 8 ingredients, the agent calls `lookup_food` for all 8 concurrently.

### Request/Response Flow

1. Client sends `POST /api/recipes/analyze` with `{ recipeId, petId, locale }` + auth token
2. Route handler validates auth token against Supabase
3. Fetches recipe + ingredients from `recipes` / `recipe_ingredients`
4. Creates `Agent` with tools, system prompt, and recipe as user message
5. Agent autonomously calls `lookup_food` per ingredient (parallel) and `get_pet_profile`
6. Agent synthesizes findings into structured JSON report with follow-up actions
7. Route handler saves analysis to `recipe_analyses`
8. Streams result back via SSE for real-time progress

## Data Model

### New Supabase Tables

**`recipes`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| owner_id | uuid | FK → auth.users, NOT NULL |
| pet_id | uuid | FK → pets, nullable |
| name | text | NOT NULL |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

RLS: users can only read/write their own recipes.

**`recipe_ingredients`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| recipe_id | uuid | FK → recipes ON DELETE CASCADE, NOT NULL |
| name | text | NOT NULL |
| preparation | text | NOT NULL |
| sort_order | int | NOT NULL, default 0 |

RLS: inherits from parent recipe's owner_id.

**`recipe_analyses`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| recipe_id | uuid | FK → recipes ON DELETE CASCADE, NOT NULL |
| pet_id | uuid | FK → pets, nullable |
| status | text | NOT NULL, one of: pending, completed, failed |
| result | jsonb | nullable (populated on completion) |
| model_used | text | nullable |
| created_at | timestamptz | default now() |

RLS: users can only read analyses for their own recipes.

### Agent Output Schema (stored in `result` JSONB)

```json
{
  "overall_safety": "safe | moderate | toxic",
  "ingredients": [
    {
      "name": "chicken breast",
      "safety_level": "safe | moderate | toxic",
      "preparation_ok": true,
      "notes": "Good protein source, well-suited for daily feeding"
    }
  ],
  "safety_alerts": ["Garlic is toxic and must be removed from this recipe"],
  "preparation_warnings": ["Chop carrots into small pieces or steam them"],
  "benefits_summary": ["Good protein-to-carb ratio", "Adequate fiber from carrots"],
  "suggestions": ["Replace garlic with parsley for flavor", "Add fish oil for omega-3"],
  "follow_up_actions": [
    {
      "type": "recipe_edit",
      "label": "Replace garlic with parsley",
      "ingredient_id": "uuid-of-garlic-ingredient",
      "new_name": "Parsley",
      "new_preparation": "Raw, chopped"
    },
    {
      "type": "detail_card",
      "label": "Add calcium supplement",
      "icon": "pill",
      "detail": "For a 28kg active dog, add ~1,200mg calcium daily..."
    }
  ]
}
```

**`follow_up_actions` types:**

- `recipe_edit` — tapping swaps the ingredient in the recipe and triggers automatic re-analysis. Fields: `ingredient_id` (uuid from `recipe_ingredients`), `new_name`, `new_preparation`.
- `detail_card` — tapping expands inline to show the agent's detailed advice. Fields: `icon` (one of: pill, heart, alert, lightbulb, shield), `detail` (markdown text).

## Navigation

The **Bowl** tab is replaced by **Recipes**:

| Tab | Route | Content |
|-----|-------|---------|
| Search | `/search` | Food search + categories (existing) |
| Scan | `/scan` | Label scanner placeholder (premium, future) |
| **Recipes** | `/recipes` | Recipe list, create/edit, AI analysis |
| Learn | `/learn` | Knowledge base (existing) |
| Profile | `/profile` | Settings, pets, history (existing) |

The `/bowl` route and its placeholder page are removed. `/recipes` takes its position (index 2) in the bottom nav.

## UI Screens

### Screen 1: Recipe List (`/recipes`)

- Shows saved recipes as cards with: name, ingredient preview (truncated), safety badge, pet name, ingredient count
- Safety badge states: **Safe** (green), **Caution** (amber), **Toxic** (red), **Not analyzed** (gray)
- "New Recipe" button (primary, full-width at bottom)
- Empty state: icon + "No recipes yet" + "Create your first recipe..." + CTA button

### Screen 2: Create / Edit Recipe (`/recipes/new` or `/recipes/edit?id=`)

- **Recipe name** — text input, required
- **Pet selector** — horizontal chip group showing user's pets + "None" option
- **Ingredients list** — card with rows (name + preparation + 44px remove button)
- **Add ingredient form** — expandable section:
  - Ingredient name (text input, free-form)
  - Preparation method (chip selector: Raw, Boiled, Cooked, Grilled, Steamed, Custom...)
  - Add / Cancel buttons
- **Analyze Recipe** button (primary, full-width)
- Form validation: recipe name required, at least one ingredient required. Error messages use `role="alert"` for accessibility.

### Screen 3: Analysis Streaming

- Spinner + "Analyzing [recipe name]" + "Checking N ingredients..."
- Ingredient-by-ingredient progress list:
  - Completed: check icon + name + safety result (fade-in animation)
  - In progress: spinner + name + "Checking..."
  - Pending: gray dot + name + "Pending"
- Skeleton placeholders for report sections below

### Screen 4: Analysis Report

- **Overall safety banner** — color-coded (green/amber/red) with Lucide icon + label + summary line
- **Ingredients breakdown** — card with rows: color dot + name + preparation + one-line note
- **Safety Alerts** section — red alert box with ShieldAlert icon (only shown if alerts exist)
- **Preparation Tips** section — amber alert box with Tag icon
- **Benefits** section — green alert box with CheckCircle icon + bullet list
- **Suggestions** section — white card with Lightbulb icon + bullet list
- **Follow-up action cards** — below suggestions:
  - `recipe_edit` cards: show swap description, tap to apply + re-analyze
  - `detail_card` cards: show label + icon, tap to expand inline detail
- **Action buttons** — "Edit Recipe" (secondary) + "Re-analyze" (primary)

### Screen 5: Error Recovery

- XCircle icon in red circle
- "Analysis failed" heading
- "Something went wrong..." description
- "Try Again" button with RefreshCw icon

## UX Requirements

- All icons: Lucide SVGs, no emojis
- All interactive elements: minimum 44x44px touch targets
- All clickable elements: `cursor-pointer`, `touch-action: manipulation`
- Preparation input: chip selector (Raw, Boiled, Cooked, Grilled, Steamed, Custom) — not free text
- Form errors: red border + `role="alert"` error message
- Streaming: SSE connection with ingredient-by-ingredient progress
- Skeleton loading: shimmer animation for report sections during analysis
- `prefers-reduced-motion`: respect for all animations
- Bilingual: all UI text and agent responses in user's locale (EN/TR) via next-intl

## Follow-Up System

After an analysis completes, the agent generates contextual follow-up actions based on:
- The recipe's specific safety and nutritional issues
- The pet's breed, age, weight, activity level, and health profile
- The food database matches and gaps

**Two action types:**

### Recipe Edit Actions
- Displayed as tappable cards below the report
- Show a clear label: "Replace garlic with parsley", "Steam the carrots"
- On tap: update the ingredient in `recipe_ingredients`, trigger automatic re-analysis
- UI shows a brief transition (ingredient swap animation) then streams new analysis
- After re-analysis, follow-up actions refresh to reflect updated recipe state

### Detail Cards
- Displayed as expandable cards below recipe edit actions
- Show label + icon (pill, heart, alert, lightbulb, shield)
- On tap: expand inline to show the agent's detailed, pet-personalized advice
- Content is markdown-rendered
- Categories informed by research: supplement recommendations, breed-specific risks, emergency guidance ("what if my dog already ate this"), nutritional gap explanations

### Why This Model (Not Conversational Chat)

Research shows the top follow-up needs are structured and predictable: ingredient swaps, supplement advice, breed-specific warnings, emergency guidance. An open chat would be harder to test, harder to localize, and produce inconsistent outputs. Structured action cards:
- Are scannable and mobile-friendly
- Produce consistent, testable UI
- Can be localized reliably (EN/TR)
- Map directly to the agent's structured output
- Cover the top 5 real-world follow-up needs identified in competitive research

## Access Control

- Recipe creation and viewing: available to all authenticated users (free tier)
- AI analysis: gated behind premium subscription tier (same pattern as `/scan`)
- Free users see recipes but get a prompt to upgrade when tapping "Analyze Recipe"

## Build & Deployment Changes

### next.config.ts

```typescript
const nextConfig: NextConfig = {
  output: process.env.BUILD_MODE === "server" ? undefined : "export",
  images: { unoptimized: true },
};
```

### package.json scripts

```json
"build:static": "next build",
"build:server": "BUILD_MODE=server next build"
```

### Dockerfile

Server mode variant: replace nginx with `node:20-alpine` running `next start`.

### Environment Variables (new)

```
NEXT_PUBLIC_API_URL=               # empty for web (same origin), full URL for Capacitor
ANTHROPIC_API_KEY=                 # server-side only, for pi-agent-core
```

### Capacitor

`capacitor.config.ts` unchanged. `webDir: "out"` continues to work with `build:static`.

`deploy-testflight.sh` updated to use `npm run build:static` explicitly.

## Out of Scope (v1)

- Photo/label scanning (OCR/vision) — future feature
- Ingredient quantities/portions — future feature
- Nutritional completeness scoring against AAFCO/NRC standards — future feature
- Supplement product recommendations (specific brands) — future feature
- Meal planning / diet tracking over time — future feature
- "Already ate it" emergency mode as a standalone feature — covered partially by detail cards
- Android / Google Play Store
