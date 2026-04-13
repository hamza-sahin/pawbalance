# PawBalance Web App

## Project Overview

PawBalance (formerly DogNutriSmart/PetPal) is a Next.js web app that replaces the original Flutter iOS app. It shares the same Supabase backend and delivers exact feature parity with the Flutter version.

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

- **Static export** (`output: 'export'`) — required for Capacitor. Dynamic routes use query params (`/search/food?id=` not `/search/food/[id]`) to stay compatible.
- **PostCSS config must be `.mjs`** — Next.js doesn't load `.ts` PostCSS configs properly with Tailwind v4.
- **Platform abstraction** — `src/lib/platform.ts` wraps all Capacitor calls behind `isNative` checks. Components never call Capacitor directly.
- **Apple Sign-In** — shown only when `isNative === true` (Capacitor/iOS). On web, only Google and email/password are offered.
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

Custom tokens defined in `src/app/globals.css` via `@theme`:

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

Copied from Flutter app's `.env.development` with `NEXT_PUBLIC_` prefix.

## Capacitor Config

- **App ID:** `com.pawbalance.app`
- **Team ID:** `7N6TBDYHYS`
- **Web Dir:** `out` (Next.js static export output)
- **Plugins:** `@capacitor-community/apple-sign-in`, `@capacitor/camera`

## Deployment Architecture

### Dual Build Mode

The app has two build targets from the same codebase:

| Target | Build | Output | Serves |
|--------|-------|--------|--------|
| iOS (Capacitor) | `npm run build:static` | `out/` static files | Bundled in app + OTA via Capgo |
| Web (K8s) | `npm run build:server` | `.next/standalone` | Node.js server with API routes |

`next.config.ts` switches on `BUILD_MODE` env var: default is `export` (static), `BUILD_MODE=server` produces `standalone`.

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

- **Web-only changes** → OTA via Capgo (no App Store involved)
- **Native changes** (ios/, capacitor.config.ts, package.json) → TestFlight build triggered
- **Docker image** → always built, pushed to registry, ArgoCD syncs via gitops repo

### API Routes

API routes live in `src/app/api/` and only work in server mode. They are silently skipped during static export (POST-only handlers are compatible with `output: 'export'`).

Both the iOS app and web app call `https://pawbalance.optalgo.com/api/...` for backend endpoints.

### AI Agent Backend

The recipe analysis agent uses `@mariozechner/pi-agent-core` running inside a Next.js Route Handler (`POST /api/recipes/analyze`). Authentication uses Claude subscription OAuth via `auth.json` at the project root (read by `AuthStorage` from `@mariozechner/pi-coding-agent`). No API key needed.

### GitOps

- **PawBalance Helm chart:** `refs/gitops/helm/pawbalance/` (separate git repo at `hamza-sahin/gitops`)
- **ArgoCD** syncs from the gitops repo, rolls out on image tag change
- **CI updates the tag:** `.github/workflows/deploy.yml` → `update-gitops` job bumps the image tag

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

- **After implementing a feature** — when the brainstorming workflow reaches its verification phase, invoke `/qa` before claiming the work is done.
- **After fixing a bug** — when the systematic-debugging workflow reaches its verification phase, invoke `/qa` before claiming the fix is done.
- **When explicitly asked** — the user can run `/qa` at any time.

### How Verification Works

The `/qa` skill (`.claude/skills/qa/SKILL.md`) runs this sequence:

1. Analyze `git diff` to determine which files changed and map them to affected screens/flows
2. Build the static export (`npm run build`) and serve `out/` locally
3. Test affected flows in the browser using the `browser-use` skill
4. Run full iOS build cycle (`npx cap sync ios` → Xcode build → simulator launch)
5. Test the same affected flows on iOS using the `ios-debug`
6. Report pass/fail per flow, per platform

Testing is **context-aware** — only flows affected by the change are tested, not a full sweep.

If any check fails, autonomously diagnose, fix, and re-run `/qa`. Stop after 3 failed attempts on the same issue and ask the user.

### When to Deploy

- **When finishing a development branch** — after `/qa` passes, invoke `/deploy` to push and ship to TestFlight.
- **When explicitly asked** — the user can run `/deploy` at any time.

### How Deployment Works

The `/deploy` skill (`.claude/skills/deploy/SKILL.md`) runs:

1. Push the current branch to remote (`git push -u origin HEAD`)
2. Run `./scripts/deploy-testflight.sh` (build → archive → upload to App Store Connect)
3. Report success or failure

`/deploy` requires `/qa` to have passed first. If not, it runs `/qa` automatically.

### When to Use UI/UX Skill

- **Before making any UI changes** — when implementing a new screen, modifying a component's layout, changing styles, or updating any visual element, invoke `/ui-ux-pro-max` first to get design guidance.
- This applies during brainstorming (design phase), systematic-debugging (if the fix involves UI), or any task that touches files in `src/components/`, `src/app/`, or `src/app/globals.css`.

## Skill Invocation Rule

When a prompt references multiple skills (e.g. `/brainstorming /ios-debug /ui-ux-pro-max implement feature A`), **ALL** referenced skills MUST be invoked via the Skill tool before proceeding. Do not skip any skill mentioned in the prompt. Invoke them in logical order (process skills like brainstorming/debugging first, then design skills like ui-ux-pro-max, then implementation/verification skills like qa/deploy/ios-debug).

## Out of Scope (deferred to future)

- Payment/subscription (Stripe + RevenueCat)
- Push notifications
- Functional label scanner (AI/OCR) — photo scanning for recipes
- Ingredient quantities/portions in recipes
- Knowledge Base articles
- Scan History data
- Android / Google Play Store

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
