# Screenshot Documentation v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture 24 screenshots of every app flow on the deployed web app at iPhone 16 viewport, with 8 per-flow README files documenting behavior and UI/UX improvement suggestions.

**Architecture:** Use `browser-use` CLI to open `https://pawbalance.optalgo.com` in headless Chromium at 393x852 viewport (iPhone 16). Navigate each screen, capture screenshots to `screenshots/iphone-16/`. After all captures, read each screenshot and invoke `/ui-ux-pro-max` skill to write README.md files with behavior documentation and improvement suggestions.

**Tech Stack:** browser-use CLI (browser automation), `/ui-ux-pro-max` skill (UI/UX analysis), Python 3 (ui-ux-pro-max search script)

**Key Paths:**
- Browser-use skill: `.claude/skills/browser-use/SKILL.md`
- UI/UX Pro Max skill: `.claude/skills/ui-ux-pro-max/SKILL.md`
- UI/UX search script: `skills/ui-ux-pro-max/scripts/search.py`
- Screenshots output: `screenshots/iphone-16/`
- Target URL: `https://pawbalance.optalgo.com`
- Viewport: 393 x 852 (iPhone 16)

**IMPORTANT — Skill invocation requirements:**
- **`/browser-use`** MUST be invoked (via Skill tool) before any `browser-use` CLI commands
- **`/ui-ux-pro-max`** MUST be invoked (via Skill tool) before writing each README

---

## Task 1: Create Directory Structure

**Files:**
- Create: `screenshots/iphone-16/auth/`
- Create: `screenshots/iphone-16/welcome/`
- Create: `screenshots/iphone-16/search/`
- Create: `screenshots/iphone-16/recipes/`
- Create: `screenshots/iphone-16/tabs/`
- Create: `screenshots/iphone-16/learn/`
- Create: `screenshots/iphone-16/profile/`
- Create: `screenshots/iphone-16/guest/`

- [ ] **Step 1: Create all screenshot directories**

```bash
cd /Users/hamzasahin/src/pawbalance
for section in auth welcome search recipes tabs learn profile guest; do
  mkdir -p "screenshots/iphone-16/${section}"
done
```

Expected: Directories created silently (no output).

- [ ] **Step 2: Verify directories exist**

```bash
ls -d screenshots/iphone-16/*/
```

Expected: 8 directories listed (auth, guest, learn, profile, recipes, search, tabs, welcome).

- [ ] **Step 3: Commit directory structure**

```bash
cd /Users/hamzasahin/src/pawbalance
for section in auth welcome search recipes tabs learn profile guest; do
  touch "screenshots/iphone-16/${section}/.gitkeep"
done
git add screenshots/iphone-16/
git commit -m "chore: create screenshot directory structure for iPhone 16 docs v2"
```

---

## Task 2: Set Up Browser and Capture Auth Flow (Logged Out)

**Skill dependency:** Invoke `/browser-use` skill before starting.

**Files:**
- Create: `screenshots/iphone-16/auth/login.png`
- Create: `screenshots/iphone-16/auth/register.png`
- Create: `screenshots/iphone-16/auth/forgot-password.png`

- [ ] **Step 1: Invoke `/browser-use` skill**

Use the Skill tool to invoke `browser-use`. This loads the browser automation instructions.

- [ ] **Step 2: Verify browser-use is available**

```bash
browser-use doctor
```

Expected: Shows browser-use is installed and ready.

- [ ] **Step 3: Open the app and set iPhone 16 viewport**

```bash
browser-use open "https://pawbalance.optalgo.com/login"
```

Then set the viewport to iPhone 16 dimensions:

```bash
browser-use python "await browser._context.pages[0].set_viewport_size({'width': 393, 'height': 852})"
```

- [ ] **Step 4: Wait for page load and capture login screen**

```bash
browser-use wait text "Sign In"
browser-use screenshot screenshots/iphone-16/auth/login.png
```

Verify by reading the screenshot file to confirm it captured correctly (no loading spinners, content visible).

- [ ] **Step 5: Navigate to register page and capture**

```bash
browser-use state
```

Find the "Sign Up" or "Register" link element index, then:

```bash
browser-use click <register-link-index>
browser-use wait text "Create Account"
browser-use screenshot screenshots/iphone-16/auth/register.png
```

Verify screenshot shows the registration form.

- [ ] **Step 6: Navigate to forgot password page and capture**

```bash
browser-use back
browser-use wait text "Sign In"
browser-use state
```

Find the "Forgot Password" link element index, then:

```bash
browser-use click <forgot-password-link-index>
browser-use wait text "Reset"
browser-use screenshot screenshots/iphone-16/auth/forgot-password.png
```

Verify screenshot shows the forgot password form.

---

## Task 3: Capture Welcome Screen (Logged Out)

**Skill dependency:** Browser session from Task 2 still active.

**Files:**
- Create: `screenshots/iphone-16/welcome/welcome.png`

- [ ] **Step 1: Navigate to welcome page**

```bash
browser-use open "https://pawbalance.optalgo.com/welcome"
```

- [ ] **Step 2: Wait for content and capture**

```bash
browser-use wait text "PawBalance"
browser-use screenshot screenshots/iphone-16/welcome/welcome.png
```

Verify screenshot shows the welcome/landing page with value propositions and CTA.

---

## Task 4: Log In and Capture Search Flow

**Skill dependency:** Browser session still active.

**Files:**
- Create: `screenshots/iphone-16/search/home-categories.png`
- Create: `screenshots/iphone-16/search/search-results.png`
- Create: `screenshots/iphone-16/search/search-no-results.png`
- Create: `screenshots/iphone-16/search/food-request-dialog.png`
- Create: `screenshots/iphone-16/search/category-browse.png`
- Create: `screenshots/iphone-16/search/food-detail.png`

- [ ] **Step 1: Log in with test account**

```bash
browser-use open "https://pawbalance.optalgo.com/login"
browser-use wait text "Sign In"
browser-use state
```

Find email input index and password input index, then:

```bash
browser-use input <email-index> "test-account-email@example.com"
browser-use input <password-index> "test-account-password"
browser-use state
```

Find the sign-in button index:

```bash
browser-use click <sign-in-button-index>
```

Wait for redirect to search/home page. Ask the user for credentials if they're not known.

- [ ] **Step 2: Capture home categories screen**

```bash
browser-use wait text "Search"
browser-use screenshot screenshots/iphone-16/search/home-categories.png
```

Verify: Shows pet selector, search bar, category grid.

- [ ] **Step 3: Capture search results**

```bash
browser-use state
```

Find the search input index:

```bash
browser-use input <search-index> "chicken"
browser-use keys "Enter"
browser-use wait text "chicken"
```

Wait for results to load (look for safety badges or food cards):

```bash
browser-use screenshot screenshots/iphone-16/search/search-results.png
```

Verify: Shows search results with safety badges.

- [ ] **Step 4: Capture no-results state**

Clear the search and type a nonsense query:

```bash
browser-use state
```

Find the search input, clear it and type nonsense:

```bash
browser-use input <search-index> "xyzfoodnotfound123"
browser-use keys "Enter"
```

Wait for no-results state to appear:

```bash
browser-use wait text "Request"
browser-use screenshot screenshots/iphone-16/search/search-no-results.png
```

- [ ] **Step 5: Capture food request dialog**

```bash
browser-use state
```

Find the "Request Food" button index:

```bash
browser-use click <request-food-button-index>
```

Wait for dialog to open:

```bash
browser-use wait text "Request"
browser-use screenshot screenshots/iphone-16/search/food-request-dialog.png
```

Close the dialog (click outside or press Escape):

```bash
browser-use keys "Escape"
```

- [ ] **Step 6: Capture category browse**

Navigate to a category with mixed safety levels:

```bash
browser-use open "https://pawbalance.optalgo.com/search"
browser-use wait text "Search"
browser-use state
```

Find a food category (e.g., "Fruits" or "Vegetables") and click it:

```bash
browser-use click <category-index>
```

Wait for category page to load:

```bash
browser-use screenshot screenshots/iphone-16/search/category-browse.png
```

Verify: Shows category header with food list and safety badges.

- [ ] **Step 7: Capture food detail**

```bash
browser-use state
```

Find a food item that likely has all content sections (safety info, preparation, benefits, warnings):

```bash
browser-use click <food-item-index>
```

Wait for detail page to load:

```bash
browser-use screenshot screenshots/iphone-16/search/food-detail.png
```

Verify: Shows food name, safety badge, and content sections. If the page scrolls, capture the above-fold state.

---

## Task 5: Capture Recipes Flow

**Skill dependency:** Browser session still active, logged in.

**Files:**
- Create: `screenshots/iphone-16/recipes/list.png`
- Create: `screenshots/iphone-16/recipes/new.png`
- Create: `screenshots/iphone-16/recipes/edit.png`
- Create: `screenshots/iphone-16/recipes/analysis.png`

- [ ] **Step 1: Navigate to recipes list**

```bash
browser-use open "https://pawbalance.optalgo.com/recipes"
browser-use wait text "Recipe"
browser-use screenshot screenshots/iphone-16/recipes/list.png
```

Verify: Shows recipe list. If empty, note this — the screenshot still documents the empty state.

- [ ] **Step 2: Capture new recipe form**

```bash
browser-use open "https://pawbalance.optalgo.com/recipes/new"
browser-use wait text "Recipe"
browser-use screenshot screenshots/iphone-16/recipes/new.png
```

Verify: Shows empty recipe creation form.

- [ ] **Step 3: Capture edit recipe form**

Navigate back to recipe list and open an existing recipe for editing. If there are existing recipes:

```bash
browser-use open "https://pawbalance.optalgo.com/recipes"
browser-use wait text "Recipe"
browser-use state
```

Find an existing recipe card and click edit, or navigate directly if a recipe ID is known:

```bash
browser-use click <recipe-card-or-edit-index>
```

If this opens the edit page:

```bash
browser-use screenshot screenshots/iphone-16/recipes/edit.png
```

If no recipes exist, navigate to `/recipes/new`, fill in minimal data to create one, then edit it. Alternatively, note that edit screenshot requires existing data.

- [ ] **Step 4: Capture analysis report**

Navigate to a recipe's analysis page. If a recipe has been analyzed:

```bash
browser-use open "https://pawbalance.optalgo.com/recipes"
browser-use wait text "Recipe"
browser-use state
```

Find an "Analysis" or "View Analysis" link/button and click it, or navigate directly:

```bash
browser-use click <analysis-button-index>
browser-use wait text "Analysis"
browser-use screenshot screenshots/iphone-16/recipes/analysis.png
```

If no analysis exists, this may show an empty/pending state. Capture whatever state is available — do NOT trigger a new analysis (it requires AI processing time).

---

## Task 6: Capture Tabs (Scan & Learn) and Learn Article

**Skill dependency:** Browser session still active, logged in.

**Files:**
- Create: `screenshots/iphone-16/tabs/scan.png`
- Create: `screenshots/iphone-16/tabs/learn.png`
- Create: `screenshots/iphone-16/learn/article.png`

- [ ] **Step 1: Capture scan tab**

```bash
browser-use open "https://pawbalance.optalgo.com/scan"
browser-use wait text "Scan"
browser-use screenshot screenshots/iphone-16/tabs/scan.png
```

Verify: Shows scanner placeholder with premium badge.

- [ ] **Step 2: Capture learn tab**

```bash
browser-use open "https://pawbalance.optalgo.com/learn"
browser-use wait text "Learn"
browser-use screenshot screenshots/iphone-16/tabs/learn.png
```

Verify: Shows learn page with search bar, category chips, and articles.

- [ ] **Step 3: Capture article detail**

```bash
browser-use state
```

Find an article card and click it:

```bash
browser-use click <article-card-index>
```

Wait for article page to load:

```bash
browser-use screenshot screenshots/iphone-16/learn/article.png
```

Verify: Shows individual article with title and content.

---

## Task 7: Capture Profile Flow

**Skill dependency:** Browser session still active, logged in.

**Files:**
- Create: `screenshots/iphone-16/profile/main.png`
- Create: `screenshots/iphone-16/profile/pets-list.png`
- Create: `screenshots/iphone-16/profile/pet-edit.png`
- Create: `screenshots/iphone-16/profile/pet-delete-dialog.png`
- Create: `screenshots/iphone-16/profile/language.png`
- Create: `screenshots/iphone-16/profile/scan-history.png`

- [ ] **Step 1: Capture profile main page**

```bash
browser-use open "https://pawbalance.optalgo.com/profile"
browser-use wait text "Profile"
browser-use screenshot screenshots/iphone-16/profile/main.png
```

Verify: Shows user card, menu items, sign out button.

- [ ] **Step 2: Capture pets list**

```bash
browser-use open "https://pawbalance.optalgo.com/profile/pets"
browser-use wait text "Pet"
browser-use screenshot screenshots/iphone-16/profile/pets-list.png
```

Verify: Shows pet cards with edit/delete options.

- [ ] **Step 3: Capture pet edit form**

```bash
browser-use state
```

Find an "Edit" button on a pet card:

```bash
browser-use click <edit-button-index>
browser-use wait text "Edit"
browser-use screenshot screenshots/iphone-16/profile/pet-edit.png
```

Verify: Shows pre-filled pet edit form.

- [ ] **Step 4: Capture pet delete dialog**

Navigate back to pets list:

```bash
browser-use open "https://pawbalance.optalgo.com/profile/pets"
browser-use wait text "Pet"
browser-use state
```

Find a "Delete" button on a pet card:

```bash
browser-use click <delete-button-index>
```

Wait for confirmation dialog:

```bash
browser-use wait text "Delete"
browser-use screenshot screenshots/iphone-16/profile/pet-delete-dialog.png
```

**IMPORTANT:** Do NOT confirm the deletion. Dismiss the dialog:

```bash
browser-use keys "Escape"
```

- [ ] **Step 5: Capture language selector**

```bash
browser-use open "https://pawbalance.optalgo.com/profile/language"
browser-use wait text "Language"
browser-use screenshot screenshots/iphone-16/profile/language.png
```

Verify: Shows language options with current selection checkmark.

- [ ] **Step 6: Capture scan history**

```bash
browser-use open "https://pawbalance.optalgo.com/profile/scan-history"
browser-use screenshot screenshots/iphone-16/profile/scan-history.png
```

Verify: Shows coming soon placeholder.

---

## Task 8: Capture Guest State and Close Browser

**Skill dependency:** Browser session still active.

**Files:**
- Create: `screenshots/iphone-16/guest/guest.png`

- [ ] **Step 1: Log out**

```bash
browser-use open "https://pawbalance.optalgo.com/profile"
browser-use wait text "Profile"
browser-use state
```

Find the "Sign Out" button:

```bash
browser-use click <sign-out-button-index>
```

Wait for redirect to login/welcome page.

- [ ] **Step 2: Navigate as guest to profile**

```bash
browser-use open "https://pawbalance.optalgo.com/profile"
```

Wait for guest profile to load:

```bash
browser-use screenshot screenshots/iphone-16/guest/guest.png
```

Verify: Shows guest profile view with login sheet/CTA and benefits of signing in.

- [ ] **Step 3: Close browser session**

```bash
browser-use close
```

- [ ] **Step 4: Verify all 24 screenshots captured**

```bash
cd /Users/hamzasahin/src/pawbalance
find screenshots/iphone-16 -name "*.png" | sort
```

Expected: 24 .png files across 8 directories:
- `auth/`: login.png, register.png, forgot-password.png (3)
- `welcome/`: welcome.png (1)
- `search/`: home-categories.png, search-results.png, search-no-results.png, food-request-dialog.png, category-browse.png, food-detail.png (6)
- `recipes/`: list.png, new.png, edit.png, analysis.png (4)
- `tabs/`: scan.png, learn.png (2)
- `learn/`: article.png (1)
- `profile/`: main.png, pets-list.png, pet-edit.png, pet-delete-dialog.png, language.png, scan-history.png (6)
- `guest/`: guest.png (1)

If any are missing, go back to the relevant task and re-capture.

- [ ] **Step 5: Commit all screenshots**

```bash
cd /Users/hamzasahin/src/pawbalance
git add screenshots/iphone-16/
git commit -m "docs: capture iPhone 16 screenshots of all app flows (v2)"
```

---

## Task 9: Write Auth Flow README

**Skill dependency:** Invoke `/ui-ux-pro-max` skill before starting.

**Files:**
- Create: `screenshots/iphone-16/auth/README.md`

- [ ] **Step 1: Invoke `/ui-ux-pro-max` skill**

Use the Skill tool to invoke `ui-ux-pro-max`. This loads the UI/UX design intelligence.

- [ ] **Step 2: Read auth screenshots for analysis**

Read each screenshot file to observe the current UI:
- `screenshots/iphone-16/auth/login.png`
- `screenshots/iphone-16/auth/register.png`
- `screenshots/iphone-16/auth/forgot-password.png`

Note key observations about layout, typography, spacing, touch targets, and visual hierarchy.

- [ ] **Step 3: Run UI/UX analysis**

```bash
cd /Users/hamzasahin/src/pawbalance
python3 skills/ui-ux-pro-max/scripts/search.py "mobile auth login register form accessibility" --domain ux -n 10
python3 skills/ui-ux-pro-max/scripts/search.py "mobile form input touch target" --domain ux -n 5
```

- [ ] **Step 4: Write auth README**

Create `screenshots/iphone-16/auth/README.md` with this structure:

```markdown
# Auth Flow

## Flow Overview
[Purpose of auth flow, how users reach it, entry points]

## Screens

### Login
![Login screen](login.png)

**Purpose:** [What the screen does]
**Key Elements:** [List main UI elements]
**Interactions:** [What the user can do]
**Transitions:** [Where the user can go from here]

### Register
![Register screen](register.png)

**Purpose:** ...
**Key Elements:** ...
**Interactions:** ...
**Transitions:** ...

### Forgot Password
![Forgot Password screen](forgot-password.png)

**Purpose:** ...
**Key Elements:** ...
**Interactions:** ...
**Transitions:** ...

## State Variations
[Empty states, error states, loading states observed]

## UI/UX Improvement Suggestions
[Suggestions based on /ui-ux-pro-max analysis and screenshot review, organized by priority:]
### Critical
- ...
### High
- ...
### Medium
- ...
```

Fill in all sections with actual observations from the screenshots and UI/UX analysis results.

---

## Task 10: Write Welcome Flow README

**Skill dependency:** `/ui-ux-pro-max` skill should already be loaded from Task 9.

**Files:**
- Create: `screenshots/iphone-16/welcome/README.md`

- [ ] **Step 1: Read welcome screenshot**

Read `screenshots/iphone-16/welcome/welcome.png` and note observations.

- [ ] **Step 2: Run UI/UX analysis**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "mobile landing page onboarding CTA value proposition" --domain landing -n 5
python3 skills/ui-ux-pro-max/scripts/search.py "mobile onboarding welcome" --domain ux -n 5
```

- [ ] **Step 3: Write welcome README**

Create `screenshots/iphone-16/welcome/README.md` following the same structure as Task 9 Step 4 but with a single screen (welcome.png). Include flow overview, screen documentation, state variations, and UI/UX improvement suggestions.

---

## Task 11: Write Search Flow README

**Files:**
- Create: `screenshots/iphone-16/search/README.md`

- [ ] **Step 1: Read all 6 search screenshots**

Read each screenshot file:
- `screenshots/iphone-16/search/home-categories.png`
- `screenshots/iphone-16/search/search-results.png`
- `screenshots/iphone-16/search/search-no-results.png`
- `screenshots/iphone-16/search/food-request-dialog.png`
- `screenshots/iphone-16/search/category-browse.png`
- `screenshots/iphone-16/search/food-detail.png`

- [ ] **Step 2: Run UI/UX analysis**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "mobile search results cards grid food safety" --domain ux -n 10
python3 skills/ui-ux-pro-max/scripts/search.py "mobile dialog modal empty state" --domain ux -n 5
python3 skills/ui-ux-pro-max/scripts/search.py "mobile category browse list detail" --domain ux -n 5
```

- [ ] **Step 3: Write search README**

Create `screenshots/iphone-16/search/README.md` following the same structure. Document all 6 screens with purpose, key elements, interactions, and transitions. Include UI/UX improvement suggestions organized by priority.

---

## Task 12: Write Recipes Flow README

**Files:**
- Create: `screenshots/iphone-16/recipes/README.md`

- [ ] **Step 1: Read all 4 recipe screenshots**

Read each screenshot file:
- `screenshots/iphone-16/recipes/list.png`
- `screenshots/iphone-16/recipes/new.png`
- `screenshots/iphone-16/recipes/edit.png`
- `screenshots/iphone-16/recipes/analysis.png`

- [ ] **Step 2: Run UI/UX analysis**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "mobile recipe form create edit list CRUD" --domain ux -n 10
python3 skills/ui-ux-pro-max/scripts/search.py "mobile AI analysis report results" --domain ux -n 5
```

- [ ] **Step 3: Write recipes README**

Create `screenshots/iphone-16/recipes/README.md` following the same structure. Document all 4 screens. Pay special attention to the AI analysis report screen and its data presentation.

---

## Task 13: Write Tabs Flow README

**Files:**
- Create: `screenshots/iphone-16/tabs/README.md`

- [ ] **Step 1: Read tabs screenshots**

Read:
- `screenshots/iphone-16/tabs/scan.png`
- `screenshots/iphone-16/tabs/learn.png`

- [ ] **Step 2: Run UI/UX analysis**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "mobile placeholder coming soon premium feature" --domain ux -n 5
```

- [ ] **Step 3: Write tabs README**

Create `screenshots/iphone-16/tabs/README.md` following the same structure. Document both tab screens and their placeholder/premium states.

---

## Task 14: Write Learn Flow README

**Files:**
- Create: `screenshots/iphone-16/learn/README.md`

- [ ] **Step 1: Read learn article screenshot**

Read `screenshots/iphone-16/learn/article.png`.

- [ ] **Step 2: Run UI/UX analysis**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "mobile article blog content reading typography" --domain ux -n 5
python3 skills/ui-ux-pro-max/scripts/search.py "article reading mobile" --domain typography -n 5
```

- [ ] **Step 3: Write learn README**

Create `screenshots/iphone-16/learn/README.md` following the same structure. Document the article detail screen. Include both the learn tab overview (cross-reference with tabs/) and the article detail.

---

## Task 15: Write Profile Flow README

**Files:**
- Create: `screenshots/iphone-16/profile/README.md`

- [ ] **Step 1: Read all 6 profile screenshots**

Read each screenshot file:
- `screenshots/iphone-16/profile/main.png`
- `screenshots/iphone-16/profile/pets-list.png`
- `screenshots/iphone-16/profile/pet-edit.png`
- `screenshots/iphone-16/profile/pet-delete-dialog.png`
- `screenshots/iphone-16/profile/language.png`
- `screenshots/iphone-16/profile/scan-history.png`

- [ ] **Step 2: Run UI/UX analysis**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "mobile profile settings menu list" --domain ux -n 5
python3 skills/ui-ux-pro-max/scripts/search.py "mobile pet form edit delete dialog confirmation" --domain ux -n 5
python3 skills/ui-ux-pro-max/scripts/search.py "mobile language selector settings" --domain ux -n 5
```

- [ ] **Step 3: Write profile README**

Create `screenshots/iphone-16/profile/README.md` following the same structure. Document all 6 screens with detailed behavior notes, especially for the delete confirmation dialog interaction pattern.

---

## Task 16: Write Guest Flow README

**Files:**
- Create: `screenshots/iphone-16/guest/README.md`

- [ ] **Step 1: Read guest screenshot**

Read `screenshots/iphone-16/guest/guest.png`.

- [ ] **Step 2: Run UI/UX analysis**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "mobile guest access login prompt CTA conversion" --domain ux -n 5
python3 skills/ui-ux-pro-max/scripts/search.py "mobile bottom sheet overlay login" --domain ux -n 5
```

- [ ] **Step 3: Write guest README**

Create `screenshots/iphone-16/guest/README.md` following the same structure. Document the guest profile state, login sheet/CTA, and the value proposition messaging for signing in.

---

## Task 17: Final Verification and Commit

**Files:**
- All `screenshots/iphone-16/**/*.png` (24 files)
- All `screenshots/iphone-16/**/README.md` (8 files)

- [ ] **Step 1: Verify all files exist**

```bash
cd /Users/hamzasahin/src/pawbalance

echo "=== Screenshots (expect 24) ==="
find screenshots/iphone-16 -name "*.png" | wc -l
find screenshots/iphone-16 -name "*.png" | sort

echo "=== READMEs (expect 8) ==="
find screenshots/iphone-16 -name "README.md" | wc -l
find screenshots/iphone-16 -name "README.md" | sort
```

Expected: 24 PNG files and 8 README.md files.

- [ ] **Step 2: Spot-check screenshot quality**

Read 3-4 screenshots from different flows to verify:
- Content is visible (no loading spinners captured)
- Viewport is correct (393px width, mobile layout)
- No cropping issues
- Pages are fully rendered

- [ ] **Step 3: Spot-check README quality**

Read 2-3 READMEs to verify:
- All screenshots are embedded with `![description](filename.png)`
- Behavior documentation is present for each screen
- UI/UX improvement suggestions section exists with prioritized items
- No placeholder text (TBD, TODO)

- [ ] **Step 4: Commit READMEs**

```bash
cd /Users/hamzasahin/src/pawbalance
git add screenshots/iphone-16/
git commit -m "docs: add flow behavior documentation and UI/UX suggestions for all screens"
```

- [ ] **Step 5: Remove .gitkeep files (cleanup)**

```bash
find screenshots/iphone-16 -name ".gitkeep" -delete
git add -u screenshots/iphone-16/
git commit -m "chore: remove .gitkeep files from screenshot directories"
```
