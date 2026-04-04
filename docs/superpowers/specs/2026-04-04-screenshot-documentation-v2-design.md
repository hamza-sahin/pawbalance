# Screenshot Documentation v2 — Design Spec

**Date:** 2026-04-04
**Purpose:** Re-capture all app screens on the deployed web app at iPhone 16 viewport, with per-flow behavior documentation and UI/UX improvement suggestions.

## Scope

- **Target URL:** `https://pawbalance.optalgo.com`
- **Viewport:** iPhone 16 (393 x 852)
- **Language:** English only
- **Output:** `screenshots/iphone-16/` with sub-folders per flow
- **Skills required:** `/browser-use` for all capture, `/ui-ux-pro-max` for each README

## Out of Scope

- Legal/static pages (terms gate, privacy policy, terms of service)
- Other viewports (desktop, tablet, other iOS devices)
- Turkish language
- Demo data setup (use existing live data on deployed app)

## Folder Structure

```
screenshots/iphone-16/
├── auth/
│   ├── README.md
│   ├── login.png
│   ├── register.png
│   └── forgot-password.png
├── welcome/
│   ├── README.md
│   └── welcome.png
├── search/
│   ├── README.md
│   ├── home-categories.png
│   ├── search-results.png
│   ├── search-no-results.png
│   ├── food-request-dialog.png
│   ├── category-browse.png
│   └── food-detail.png
├── recipes/
│   ├── README.md
│   ├── list.png
│   ├── new.png
│   ├── edit.png
│   └── analysis.png
├── tabs/
│   ├── README.md
│   ├── scan.png
│   └── learn.png
├── learn/
│   ├── README.md
│   └── article.png
├── profile/
│   ├── README.md
│   ├── main.png
│   ├── pets-list.png
│   ├── pet-edit.png
│   ├── pet-delete-dialog.png
│   ├── language.png
│   └── scan-history.png
└── guest/
    ├── README.md
    └── guest.png
```

**Total: 24 screenshots + 8 README files**

## Screen Inventory (24 screenshots)

### Auth (3) — captured while logged out
1. **login.png** — email/password fields, social login buttons, links to register/forgot password
2. **register.png** — name, email, password, confirm password, social login
3. **forgot-password.png** — email input, send reset link button

### Welcome (1) — captured while logged out
4. **welcome.png** — landing page with value propositions and CTA

### Search (6) — captured while logged in
5. **home-categories.png** — pet selector, search bar, category grid
6. **search-results.png** — query "chicken", result cards with safety badges
7. **search-no-results.png** — query with no matches, "Request Food" button visible
8. **food-request-dialog.png** — modal open over no-results screen
9. **category-browse.png** — category with mixed safe/caution/toxic foods
10. **food-detail.png** — food with all content sections populated

### Recipes (4) — captured while logged in
11. **list.png** — recipe list showing existing recipes with analysis status
12. **new.png** — create recipe form (empty state)
13. **edit.png** — edit form pre-filled with existing recipe
14. **analysis.png** — completed AI analysis report for a recipe

### Tabs (2) — captured while logged in
15. **scan.png** — scanner placeholder with premium badge
16. **learn.png** — learn page with search bar, category chips, articles

### Learn (1) — captured while logged in
17. **article.png** — individual article detail page

### Profile (6) — captured while logged in
18. **main.png** — user card, menu items, sign out
19. **pets-list.png** — pet cards with edit/delete options
20. **pet-edit.png** — pre-filled pet edit form
21. **pet-delete-dialog.png** — confirmation modal over pets list
22. **language.png** — language selector with current selection
23. **scan-history.png** — coming soon placeholder

### Guest (1) — captured while logged out / guest mode
24. **guest.png** — profile page as guest with login sheet/CTA

## README Documentation Format

Each flow folder's `README.md` includes:

### Sections
1. **Flow Overview** — purpose of this flow, how users reach it
2. **Screens** — for each screenshot:
   - Embedded image (`![description](filename.png)`)
   - What the screen does (purpose, key elements)
   - User interactions available
   - Transitions to/from other screens
3. **State Variations** — empty states, loading, errors if observed
4. **UI/UX Improvement Suggestions** — generated via `/ui-ux-pro-max` skill, covering:
   - Layout and spacing issues
   - Typography and readability
   - Touch target sizing
   - Visual hierarchy
   - Interaction patterns
   - Accessibility concerns
   - Consistency with design system

## Capture Process

### Phase 1 — Auth & Welcome (logged out)
1. Open deployed URL in browser at iPhone 16 viewport (393x852)
2. Navigate to login, register, forgot-password — capture each
3. Navigate to welcome page — capture

### Phase 2 — Authenticated Flows (logged in)
1. Log in with test account
2. Capture search flow: home, search results ("chicken"), no results, food request dialog, category browse, food detail
3. Capture recipes flow: list, new, edit, analysis
4. Capture tab placeholders: scan, learn
5. Capture learn flow: article detail
6. Capture profile flow: main, pets list, pet edit, pet delete dialog, language, scan history

### Phase 3 — Guest State
1. Log out or navigate as guest
2. Capture guest profile page with login sheet

### Phase 4 — Documentation
For each flow folder, invoke `/ui-ux-pro-max` and write README.md with behavior documentation and improvement suggestions.

### Phase 5 — Verification
- Confirm all 24 screenshots exist in correct folders
- Confirm all 8 READMEs are written with embedded screenshots
- Spot-check quality (no loading spinners, correct viewport, no cropping)

## Skill Dependencies

- **`/browser-use`** — MUST be invoked for all browser automation and screenshot capture
- **`/ui-ux-pro-max`** — MUST be invoked when writing each flow README to generate improvement suggestions
