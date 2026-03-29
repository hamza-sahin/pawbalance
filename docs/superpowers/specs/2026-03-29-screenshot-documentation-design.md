# Screenshot Documentation Capture — Design Spec

**Date:** 2026-03-29
**Purpose:** Capture comprehensive UI/UX reference screenshots of every user flow across desktop and iOS devices, for future design improvement work.

## Scope

- **Language:** English only
- **Desktop viewports:** 1440px, 768px
- **iOS devices:** iPhone SE, iPhone 16, iPhone 16 Pro Max
- **Total:** ~18 screens x 5 viewports = ~90 screenshots

## Folder Structure

```
screenshots/
├── desktop/
│   ├── 1440/
│   │   ├── auth/
│   │   │   ├── login.png
│   │   │   ├── register.png
│   │   │   └── forgot-password.png
│   │   ├── onboarding/
│   │   │   └── pet-creation.png
│   │   ├── search/
│   │   │   ├── home-categories.png
│   │   │   ├── search-results.png
│   │   │   ├── search-no-results.png
│   │   │   ├── food-request-dialog.png
│   │   │   ├── category-browse.png
│   │   │   └── food-detail.png
│   │   ├── tabs/
│   │   │   ├── scan.png
│   │   │   ├── bowl.png
│   │   │   └── learn.png
│   │   └── profile/
│   │       ├── main.png
│   │       ├── pets-list.png
│   │       ├── pet-edit.png
│   │       ├── pet-delete-dialog.png
│   │       ├── language.png
│   │       └── scan-history.png
│   └── 768/
│       ├── auth/
│       │   ├── login.png
│       │   ├── register.png
│       │   └── forgot-password.png
│       ├── onboarding/
│       │   └── pet-creation.png
│       ├── search/
│       │   ├── home-categories.png
│       │   ├── search-results.png
│       │   ├── search-no-results.png
│       │   ├── food-request-dialog.png
│       │   ├── category-browse.png
│       │   └── food-detail.png
│       ├── tabs/
│       │   ├── scan.png
│       │   ├── bowl.png
│       │   └── learn.png
│       └── profile/
│           ├── main.png
│           ├── pets-list.png
│           ├── pet-edit.png
│           ├── pet-delete-dialog.png
│           ├── language.png
│           └── scan-history.png
├── ios/
│   ├── iphone-se/
│   │   ├── auth/
│   │   │   ├── login.png
│   │   │   ├── register.png
│   │   │   └── forgot-password.png
│   │   ├── onboarding/
│   │   │   └── pet-creation.png
│   │   ├── search/
│   │   │   ├── home-categories.png
│   │   │   ├── search-results.png
│   │   │   ├── search-no-results.png
│   │   │   ├── food-request-dialog.png
│   │   │   ├── category-browse.png
│   │   │   └── food-detail.png
│   │   ├── tabs/
│   │   │   ├── scan.png
│   │   │   ├── bowl.png
│   │   │   └── learn.png
│   │   └── profile/
│   │       ├── main.png
│   │       ├── pets-list.png
│   │       ├── pet-edit.png
│   │       ├── pet-delete-dialog.png
│   │       ├── language.png
│   │       └── scan-history.png
│   ├── iphone-16/
│   │   └── (same structure as iphone-se)
│   └── iphone-16-pro-max/
│       └── (same structure as iphone-se)
```

## Demo Data

Set up before capturing to ensure polished, on-brand screenshots.

### Pets (3)

| Name | Breed | Age | Weight | Gender | Neutered | Activity | BCS | Photo |
|------|-------|-----|--------|--------|----------|----------|-----|-------|
| Luna | Golden Retriever | 24 months | 28 kg | Female | Yes | Active | 5 (ideal) | Yes — stock dog photo |
| Milo | French Bulldog | 14 months | 12 kg | Male | Yes | Moderate | 6 | Yes — stock dog photo |
| Bella | Labrador | 8 months | 18 kg | Female | No | Very Active | 4 | Yes — stock dog photo |

### Search Scenarios

- **"chicken"** — query for search results screenshot (returns multiple foods with mixed safety levels)
- **"xyzfoodnotfound"** — query for no-results state + food request dialog
- **Category browse** — pick a category with mixed safe/caution/toxic foods for visual variety
- **Food detail** — pick a food with all content sections populated (dangerous parts, preparation, warnings, benefits)

## Capture Approach

**Parallel by platform:** Desktop browser automation and iOS simulator capture run concurrently where possible.

### Phase 1 — Build & Serve

1. `npm run build` — static export to `out/`
2. Serve `out/` on localhost (e.g., `npx serve out -l 3000`)
3. `npx cap sync ios` — copy build to iOS project
4. Xcode build for simulators

### Phase 2 — Demo Data Setup

1. Log in to the app with test account
2. Create the 3 demo pets (Luna, Milo, Bella) with photos via the onboarding/pet-add flow
3. Verify pets appear correctly in the pets list

### Phase 3 — Parallel Capture

**Desktop agent (browser automation):**
1. Resize browser to 1440px width
2. Capture auth screens (login, register, forgot password) while logged out
3. Log in
4. Capture all authenticated screens in order:
   - Search home (categories), search results, no results, food request dialog, category browse, food detail
   - Tab placeholders (scan, bowl, learn)
   - Profile, pets list, pet edit, pet delete dialog, language, scan history
5. Resize to 768px
6. Repeat all captures

**iOS agent (simulator):**
1. Boot iPhone SE simulator
2. Install and launch app
3. Capture auth screens while logged out
4. Log in
5. Capture all authenticated screens (same order as desktop)
6. Shut down iPhone SE
7. Repeat for iPhone 16
8. Repeat for iPhone 16 Pro Max

### Phase 4 — Verification

- Confirm all ~90 screenshots exist in correct folders
- Spot-check a few for quality (no loading spinners captured, correct viewport, no cropping issues)

## Screen Inventory (18 screens)

### Auth (3 screens — captured while logged out)
1. **Login** — email/password fields, social login buttons, links
2. **Register** — name, email, password, confirm password, social login
3. **Forgot Password** — email input, send reset link button

### Onboarding (1 screen)
4. **Pet Creation** — full pet form with photo picker, all fields

### Search Flow (6 screens)
5. **Home / Categories** — pet selector, search bar, category grid
6. **Search Results** — query "chicken", result cards with safety badges
7. **Search No Results** — query with no matches, "Request Food" button visible
8. **Food Request Dialog** — modal open over no-results screen
9. **Category Browse** — category header, safety badge breakdown, food list
10. **Food Detail** — food name, safety badge, all content sections

### Tab Placeholders (3 screens)
11. **Scan** — scanner placeholder with premium badge
12. **Bowl** — meal builder + portion calculator cards, coming soon
13. **Learn** — search bar, category chips, coming soon

### Profile Flow (5 screens)
14. **Profile Main** — user card, menu items, sign out
15. **Pets List** — 3 pet cards with edit/delete buttons
16. **Pet Edit** — pre-filled form for one pet
17. **Pet Delete Dialog** — confirmation modal over pets list
18. **Language** — English selected with checkmark

### Profile Placeholder (1 screen)
19. **Scan History** — coming soon placeholder

**Note:** The onboarding screen will be captured using the pet form in its initial empty state, navigated to from profile > pets > add pet (since our test account will already have pets).

## Out of Scope

- Turkish language screenshots
- iPad screenshots
- Video recordings of flows
- Interaction states (hover, focus, active) beyond what's naturally visible
- Loading/skeleton states (we wait for content to load before capturing)
