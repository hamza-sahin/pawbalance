# PawBalance Web App

## Agent Rules
- Always activate caveman mode.
- **MANDATORY SKILL LOADING:** When user message contains `/skill-name` references, you MUST call `Skill("skill-name")` for EVERY SINGLE ONE before doing any other work. This means literally invoking the Skill tool — not "following the skill's process yourself" or "setting up tasks." Count the `/` references, invoke that exact number of Skill tool calls. Examples of WRONG behavior: seeing `/superpowers:brainstorming` and starting to brainstorm without calling `Skill("superpowers:brainstorming")`; seeing `/caveman` and skipping it because caveman mode is already active via hook. The hook and the skill are different things — invoke both.

## Project Overview

PawBalance (formerly DogNutriSmart/PetPal) — Next.js web app replacing original Flutter iOS app. Same Supabase backend, exact feature parity with Flutter version.

## Tech Stack

- **Framework:** Next.js 15 (App Router, static export)
- **Styling:** Tailwind CSS 4 with custom `@theme` tokens in `globals.css`
- **State:** Zustand (auth + pet stores)
- **Backend:** Supabase (shared project with Flutter app)
- **i18n:** next-intl (EN + TR)
- **iOS:** Capacitor 7 (wraps static export for App Store)
- **Validation:** Zod
- **Types:** TypeScript strict mode

## Key Architecture Decisions

- **Static export** (`output: 'export'`) — required for Capacitor. Dynamic routes use query params (`/search/food?id=` not `/search/food/[id]`) for compatibility.
- **PostCSS config must be `.mjs`** — Next.js won't load `.ts` PostCSS configs with Tailwind v4.
- **Platform abstraction** — `src/lib/platform.ts` wraps all Capacitor calls behind `isNative` checks. Components never call Capacitor directly.
- **Apple Sign-In** — shown only when `isNative === true` (Capacitor/iOS). Web offers only Google and email/password.
- **No local database** — Flutter used sqflite for caching; web calls Supabase directly.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root: providers, next-intl, global CSS
│   ├── page.tsx                # Redirects / → /search
│   ├── providers.tsx           # Client-side auth listener wrapper
│   ├── (auth)/                 # Login, Register, Forgot Password (centered layout)
│   ├── (app)/                  # Protected shell with BottomNav
│   │   ├── scan/               # Scanner placeholder (premium)
│   │   ├── recipes/            # Recipe CRUD + AI analysis
│   │   │   ├── new/            # Create recipe
│   │   │   ├── edit/           # Edit recipe (?id=)
│   │   │   └── analysis/       # AI analysis streaming + report (?id=)
│   │   ├── search/             # Food search + category grid (home tab)
│   │   │   ├── category/       # Category foods list (?name=)
│   │   │   └── food/           # Food detail (?id=)
│   │   ├── learn/              # Knowledge base placeholder
│   │   └── profile/            # Profile, language, pets, scan history
│   └── onboarding/             # Pet creation wizard (standalone, no nav)
├── components/
│   ├── ui/                     # Button, Card, Input, Skeleton, Badge, Dialog
│   ├── food/                   # SafetyBadge, FoodCard, CategoryGrid, FoodRequestDialog
│   ├── recipe/                 # RecipeCard, RecipeForm, IngredientList, PreparationChips, AnalysisReport, AnalysisProgress, FollowUpActions
│   ├── pet/                    # PetCard, PetForm, BCSSlider, ActivityLevelSelector, BreedSelector, PhotoPicker
│   ├── auth/                   # SocialLoginButtons
│   └── navigation/             # BottomNav
├── lib/
│   ├── supabase.ts             # Supabase browser client
│   ├── platform.ts             # Capacitor isNative + pickImage
│   ├── api.ts                  # API URL helper (NEXT_PUBLIC_API_URL)
│   ├── types.ts                # Zod schemas + TS types for all models
│   ├── constants.ts            # Breeds, BCS data, category icons, limits
│   ├── validators.ts           # Pet + recipe form Zod schemas
│   └── agent/                  # Server-side AI agent (only runs in server mode)
│       ├── create-agent.ts     # Agent factory (AuthStorage + ModelRegistry + tools)
│       ├── system-prompt.ts    # Canine nutritionist system prompt
│       └── tools/
│           ├── lookup-food.ts  # Queries foods table via search_foods RPC
│           └── get-pet-profile.ts # Fetches pet profile from Supabase
├── hooks/
│   ├── use-auth.ts             # Sign in/up/out, Google, Apple, password reset
│   ├── use-pets.ts             # CRUD, photo upload, pet limit
│   ├── use-food-search.ts      # Search, categories, detail, food request
│   ├── use-recipes.ts          # Recipe CRUD + ingredient swap
│   ├── use-recipe-analysis.ts  # SSE client for AI analysis streaming
│   └── use-locale.ts           # Locale get/set with cookie + localStorage
├── store/
│   ├── auth-store.ts           # User, session, subscription tier
│   ├── pet-store.ts            # Pets list, selected pet (localStorage)
│   └── recipe-store.ts         # Recipes list, analyses map
└── messages/
    ├── en.json                 # English (100+ keys)
    └── tr.json                 # Turkish (100+ keys)
```

## Design System

Custom tokens in `src/app/globals.css` via `@theme`:

- **Canvas:** `#FAF8F5` (warm beige background)
- **Primary:** `#7C9A82` (sage green)
- **Surface:** `#FFFFFF` (cards)
- **Border:** `#E0DCD5`
- **Text:** `#2D3436` / secondary `#636E72` / tertiary `#B2BEC3`
- **Safety:** Safe green `#8FBC8F`, Caution amber `#DAA520`, Toxic red `#CD5C5C`
- **Border radius:** card 16px, button 12px, input 12px

## Supabase Tables

| Table | Key Columns |
|---|---|
| `pets` | id, owner_id, name, breed, age_months, weight_kg, gender, is_neutered, body_condition_score, activity_level, avatar_url |
| `foods` | id, name_en, name_tr, category_en, category_tr, safety_level, dangerous_parts, preparation, benefits, warnings |
| `food_categories` | id, name_en, name_tr, food_count |
| `food_requests` | id, user_id, food_name, status |
| `recipes` | id, owner_id, pet_id, name, created_at, updated_at |
| `recipe_ingredients` | id, recipe_id, name, preparation, sort_order |
| `recipe_analyses` | id, recipe_id, pet_id, status, result (jsonb), model_used, created_at |

RPC functions: `search_foods(search_query)`, `get_similar_foods(search_query, limit_count)`

Storage bucket: `pet-photos` (path: `{userId}/{petId}.{ext}`)

## Commands

```bash
npm run dev                      # Dev server (static export mode)
BUILD_MODE=server npm run dev    # Dev server with API routes
npm run build:static             # Static export → out/ (Capacitor/OTA)
npm run build:server             # Server build → .next/standalone (K8s)
npx cap sync ios                 # Copy build to iOS project
npx cap open ios                 # Open Xcode
./scripts/deploy-testflight.sh   # Full deploy: build → archive → upload
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Copied from Flutter app `.env.development` with `NEXT_PUBLIC_` prefix.

## Capacitor Config

- **App ID:** `com.pawbalance.app`
- **Team ID:** `7N6TBDYHYS`
- **Web Dir:** `out` (Next.js static export output)
- **Plugins:** `@capacitor-community/apple-sign-in`, `@capacitor/camera`

## Deployment Architecture

### Dual Build Mode

Two build targets from same codebase:

| Target | Build | Output | Serves |
|--------|-------|--------|--------|
| iOS (Capacitor) | `npm run build:static` | `out/` static files | Bundled in app + OTA via Capgo |
| Web (K8s) | `npm run build:server` | `.next/standalone` | Node.js server with API routes |

`next.config.ts` switches on `BUILD_MODE` env var: default `export` (static), `BUILD_MODE=server` produces `standalone`.

### Deployment Pipelines (on push to master)

```
git push to master
    │
    ├─► Static build (npm run build → out/)
    │       │
    │       ├─► OTA: zip → MinIO → Capgo → iOS app downloads on launch
    │       └─► TestFlight: cap sync → Xcode → App Store (only if native files changed)
    │
    └─► Docker build (Dockerfile.server → Node.js server on port 3000)
            │
            └─► K8s: push to registry.optalgo.com → ArgoCD → pawbalance.optalgo.com
```

- **Web-only changes** → OTA via Capgo (no App Store)
- **Native changes** (ios/, capacitor.config.ts, package.json) → TestFlight build triggered
- **Docker image** → always built, pushed to registry, ArgoCD syncs via gitops repo

### API Routes

API routes in `src/app/api/`, only work in server mode. Silently skipped during static export (POST-only handlers compatible with `output: 'export'`).

Both iOS app and web app call `https://pawbalance.optalgo.com/api/...` for backend endpoints.

### AI Agent Backend

Recipe analysis agent uses `@mariozechner/pi-agent-core` inside Next.js Route Handler (`POST /api/recipes/analyze`). Auth uses Claude subscription OAuth via `auth.json` at project root (read by `AuthStorage` from `@mariozechner/pi-coding-agent`). No API key needed.

### GitOps

- **PawBalance Helm chart:** `refs/gitops/helm/pawbalance/` (separate git repo at `hamza-sahin/gitops`)
- **ArgoCD** syncs from gitops repo, rolls out on image tag change
- **CI updates tag:** `.github/workflows/deploy.yml` → `update-gitops` job bumps image tag

### Key URLs

- **Production web:** `https://pawbalance.optalgo.com`
- **Container registry:** `registry.optalgo.com/pawbalance-web`
- **Capgo (self-hosted):** Supabase edge functions at `supabase.optalgo.com`
- **MinIO (OTA bundles):** `minio.optalgo.com/capgo/apps/com.pawbalance.app/versions/`

## Remaining Setup

- Add `http://localhost:3000` and production URL as authorized redirect URIs in Google Cloud Console + Supabase Auth
- Create App Store Connect app with bundle ID `com.pawbalance.app`
- App Store API Key ID: `4NH42JUWM6`, auth key at `~/.private_keys/`

## QA & Verification Rules

### When to Verify

- **After implementing feature** — once qualifying code edits are made in a feature session, `/qa` is required before claiming done.
- **After fixing bug** — once qualifying code edits are made in a bug-fix session, `/qa` is required before claiming the fix is done.
- **When explicitly asked** — user can run `/qa` anytime.

### How Verification Works

`/qa` skill (`.agents/skills/qa/SKILL.md`) runs:

1. Analyze `git diff` to determine changed files and affected flows
2. Build and serve the local app on `http://localhost:3001`
   - `npm run build` + `npx serve out -p 3001` for static-only changes
   - `npm run build:server` + `npm run start -- --hostname 127.0.0.1 --port 3001` for API/backend changes
3. Launch browser-use in iPhone 16 Pro browser view via `./scripts/browser-use-iphone-16-pro.sh`
4. Log in with `test@pawbalance.com` for protected flows
5. Test affected flows locally in the browser only
6. Persist QA result in `.codex/state/qa-sessions.json`

Testing is **context-aware** — only affected flows are tested, not a full sweep.

If code was edited after the last QA pass, the old QA pass is invalid. A success claim requires a post-edit `/qa` pass.

If QA cannot pass because the environment is blocked or the issue still fails after retries, report blocked/failing status explicitly instead of claiming completion.

### When to Deploy

- **When finishing development branch** — after `/qa` passes, invoke `/deploy`.
- **When explicitly asked** — user can run `/deploy` anytime.
`/deploy` requires `/qa` passed first. If not, run `/qa` before deployment.

### When to Use UI/UX Skill

- **Before any UI changes** — when implementing new screen, modifying component layout, changing styles, or updating visual elements, invoke `/ui-ux-pro-max` first for design guidance.
- Applies during brainstorming (design phase), systematic-debugging (if fix involves UI), or any task touching files in `src/components/`, `src/app/`, or `src/app/globals.css`.

## Skill Invocation Rule

When prompt references skills (e.g. `/brainstorming /qa /ui-ux-pro-max implement feature A`), **ALL** referenced skills MUST be invoked via Skill tool before ANY other work. Zero exceptions. Count skills in message → invoke exactly that many. Invoke in parallel (single response with multiple Skill calls) when possible. Never skip because "already active via hook" or "covered by another skill."

## Out of Scope (deferred)

- Payment/subscription (Stripe + RevenueCat)
- Push notifications
- Functional label scanner (AI/OCR) — photo scanning for recipes
- Ingredient quantities/portions in recipes
- Knowledge Base articles
- Scan History data
- Android / Google Play Store

## graphify

Project has graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in session, run `./scripts/rebuild-graphify.sh` to keep graph current
