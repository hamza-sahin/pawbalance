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
│   │   ├── bowl/               # Home Cooking placeholder
│   │   ├── search/             # Food search + category grid (home tab)
│   │   │   ├── category/       # Category foods list (?name=)
│   │   │   └── food/           # Food detail (?id=)
│   │   ├── learn/              # Knowledge base placeholder
│   │   └── profile/            # Profile, language, pets, scan history
│   └── onboarding/             # Pet creation wizard (standalone, no nav)
├── components/
│   ├── ui/                     # Button, Card, Input, Skeleton, Badge, Dialog
│   ├── food/                   # SafetyBadge, FoodCard, CategoryGrid, FoodRequestDialog
│   ├── pet/                    # PetCard, PetForm, BCSSlider, ActivityLevelSelector, BreedSelector, PhotoPicker
│   ├── auth/                   # SocialLoginButtons
│   └── navigation/             # BottomNav
├── lib/
│   ├── supabase.ts             # Supabase browser client
│   ├── platform.ts             # Capacitor isNative + pickImage
│   ├── types.ts                # Zod schemas + TS types for all models
│   ├── constants.ts            # Breeds, BCS data, category icons, limits
│   └── validators.ts           # Pet form Zod schema
├── hooks/
│   ├── use-auth.ts             # Sign in/up/out, Google, Apple, password reset
│   ├── use-pets.ts             # CRUD, photo upload, pet limit
│   ├── use-food-search.ts      # Search, categories, detail, food request
│   └── use-locale.ts           # Locale get/set with cookie + localStorage
├── store/
│   ├── auth-store.ts           # User, session, subscription tier
│   └── pet-store.ts            # Pets list, selected pet (localStorage)
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

RPC functions: `search_foods(search_query)`, `get_similar_foods(search_query, limit_count)`

Storage bucket: `pet-photos` (path: `{userId}/{petId}.{ext}`)

## Commands

```bash
npm run dev              # Dev server
npm run build            # Static export → out/
npx cap sync ios         # Copy build to iOS project
npx cap open ios         # Open Xcode
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

## Remaining Setup

- Add `http://localhost:3000` and production URL as authorized redirect URIs in Google Cloud Console + Supabase Auth
- Create App Store Connect app with bundle ID `com.pawbalance.app`
- App Store API Key ID: `4NH42JUWM6`, auth key at `~/.private_keys/`

## Out of Scope (deferred to future)

- Payment/subscription (Stripe + RevenueCat)
- Push notifications
- Functional label scanner (AI/OCR)
- Functional Meal Builder and Portion Calculator
- Knowledge Base articles
- Scan History data
- Android / Google Play Store
