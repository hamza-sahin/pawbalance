# Screenshot Documentation Capture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture ~90 screenshots of every user flow across 5 viewports (desktop 1440px, desktop 768px, iPhone SE, iPhone 16, iPhone 16 Pro Max) for UI/UX documentation.

**Architecture:** Build the static web app and serve locally. Set up demo data (3 pets with photos) via browser automation. Capture desktop screenshots using browser-use CLI at two viewport widths. Capture iOS screenshots using ios-debug simulator scripts on three device sizes. Desktop and iOS capture run in parallel where possible.

**Tech Stack:** browser-use CLI (desktop), ios-debug scripts (iOS simulators), Next.js static export, Capacitor iOS build

**Key Paths:**
- ios-debug scripts: `.claude/skills/ios-debug/scripts/`
- Browser-use skill: `.claude/skills/browser-use/SKILL.md`
- iOS workspace: `ios/App/App.xcworkspace`
- Scheme: `App`
- Bundle ID: `com.pawbalance.app`
- Screenshots output: `screenshots/`

**Simulator UDIDs (existing):**
- iPhone 16: `DBCBEB59-81CD-403D-BE0F-B54AA8EB7736`
- iPhone 16 Pro Max: `6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4`
- iPhone SE (3rd gen): needs to be created

**Login credentials:** Use the existing test account. Discover email/password from the user or from env/config.

---

## Task 1: Create Directory Structure and Download Demo Photos

**Files:**
- Create: `screenshots/desktop/1440/auth/`, `screenshots/desktop/1440/onboarding/`, `screenshots/desktop/1440/search/`, `screenshots/desktop/1440/tabs/`, `screenshots/desktop/1440/profile/`
- Create: `screenshots/desktop/768/auth/`, `screenshots/desktop/768/onboarding/`, `screenshots/desktop/768/search/`, `screenshots/desktop/768/tabs/`, `screenshots/desktop/768/profile/`
- Create: `screenshots/ios/iphone-se/auth/`, `screenshots/ios/iphone-se/onboarding/`, `screenshots/ios/iphone-se/search/`, `screenshots/ios/iphone-se/tabs/`, `screenshots/ios/iphone-se/profile/`
- Create: `screenshots/ios/iphone-16/auth/`, `screenshots/ios/iphone-16/onboarding/`, `screenshots/ios/iphone-16/search/`, `screenshots/ios/iphone-16/tabs/`, `screenshots/ios/iphone-16/profile/`
- Create: `screenshots/ios/iphone-16-pro-max/auth/`, `screenshots/ios/iphone-16-pro-max/onboarding/`, `screenshots/ios/iphone-16-pro-max/search/`, `screenshots/ios/iphone-16-pro-max/tabs/`, `screenshots/ios/iphone-16-pro-max/profile/`
- Create: `/tmp/petpal-demo-photos/` (temp dir for stock dog photos)

- [ ] **Step 1: Create all screenshot directories**

```bash
cd /Users/hamzasahin/src/petpal/web

# Desktop directories
for size in 1440 768; do
  for section in auth onboarding search tabs profile; do
    mkdir -p "screenshots/desktop/${size}/${section}"
  done
done

# iOS directories
for device in iphone-se iphone-16 iphone-16-pro-max; do
  for section in auth onboarding search tabs profile; do
    mkdir -p "screenshots/ios/${device}/${section}"
  done
done
```

Expected: Directories created silently (no output).

- [ ] **Step 2: Download 3 stock dog photos for demo pets**

Download free-to-use dog photos from Unsplash for the 3 demo pets (Golden Retriever, French Bulldog, Labrador). Save to a temp directory.

```bash
mkdir -p /tmp/petpal-demo-photos

# Golden Retriever for Luna
curl -L -o /tmp/petpal-demo-photos/luna.jpg "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop"

# French Bulldog for Milo
curl -L -o /tmp/petpal-demo-photos/milo.jpg "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop"

# Labrador for Bella
curl -L -o /tmp/petpal-demo-photos/bella.jpg "https://images.unsplash.com/photo-1579110727696-46b927fc4f48?w=400&h=400&fit=crop"
```

Expected: 3 JPEG files in `/tmp/petpal-demo-photos/`, each ~50-100KB.

- [ ] **Step 3: Verify photos downloaded**

```bash
ls -la /tmp/petpal-demo-photos/
```

Expected: `luna.jpg`, `milo.jpg`, `bella.jpg` all present with non-zero file sizes.

---

## Task 2: Build Web App and Start Local Server

**Files:**
- Read: `package.json` (for build command)
- Output: `out/` directory (static export)

- [ ] **Step 1: Install dependencies if needed**

```bash
cd /Users/hamzasahin/src/petpal/web
npm install
```

Expected: Dependencies up to date or freshly installed.

- [ ] **Step 2: Build the static export**

```bash
cd /Users/hamzasahin/src/petpal/web
npm run build
```

Expected: Build completes successfully, `out/` directory created with static HTML/CSS/JS.

- [ ] **Step 3: Start a local server in the background**

```bash
cd /Users/hamzasahin/src/petpal/web
npx serve out -l 3000 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
```

Expected: Server starts on `http://localhost:3000`, PID printed.

- [ ] **Step 4: Verify server is responding**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
```

Expected: `200`

---

## Task 3: Create iPhone SE Simulator and Build iOS App

This task can run **in parallel** with Tasks 4 and 5 (demo data setup and desktop capture).

**Files:**
- Read: `ios/App/App.xcworkspace` (Xcode workspace)
- Read: `capacitor.config.ts`

- [ ] **Step 1: Sync Capacitor to iOS project**

```bash
cd /Users/hamzasahin/src/petpal/web
npx cap sync ios
```

Expected: Web assets copied to `ios/App/App/public/`, pods installed.

- [ ] **Step 2: Create iPhone SE (3rd generation) simulator**

```bash
cd /Users/hamzasahin/src/petpal/web
python3 .claude/skills/ios-debug/scripts/simctl_create.py \
  --device "iPhone SE (3rd generation)" \
  --runtime "iOS 18.6" \
  --name "PawBalance iPhone SE"
```

Expected: New simulator created, UDID printed. Save this UDID — referred to as `$SE_UDID` in later tasks.

Note: Using iOS 18.6 as the runtime since it's the stable version available. If it fails, try the latest available runtime from `xcrun simctl list runtimes`.

- [ ] **Step 3: Build the iOS app for simulators**

```bash
cd /Users/hamzasahin/src/petpal/web
xcodebuild build \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination "generic/platform=iOS Simulator" \
  -quiet
```

Expected: Build succeeds. The `.app` bundle will be in the DerivedData directory.

- [ ] **Step 4: Find the built .app bundle path**

```bash
find ~/Library/Developer/Xcode/DerivedData -name "App.app" -path "*/Debug-iphonesimulator/*" -maxdepth 5 2>/dev/null | head -1
```

Expected: Path like `~/Library/Developer/Xcode/DerivedData/App-<hash>/Build/Products/Debug-iphonesimulator/App.app`. Save this as `$APP_PATH` for later tasks.

---

## Task 4: Set Up Demo Data (Create 3 Pets via Browser)

**Depends on:** Task 2 (server running)

This task uses browser-use to log in and create 3 demo pets with photos. The data lives in Supabase, so all platforms (desktop + iOS) will show the same pets.

**Important:** Ask the user for the test account email and password before starting this task.

- [ ] **Step 1: Verify browser-use is available**

```bash
browser-use doctor
```

Expected: All checks pass.

- [ ] **Step 2: Open the app and navigate to login**

```bash
browser-use open http://localhost:3000/login
```

Expected: Browser opens login page.

- [ ] **Step 3: Inspect login page elements**

```bash
browser-use state
```

Expected: List of elements including email input, password input, sign-in button. Note the indices.

- [ ] **Step 4: Log in with test account**

Use the indices from Step 3 to fill the form:

```bash
browser-use input <email_index> "TEST_EMAIL"
browser-use input <password_index> "TEST_PASSWORD"
browser-use click <signin_button_index>
```

Replace `<email_index>`, `<password_index>`, `<signin_button_index>` with actual indices from `browser-use state`.
Replace `TEST_EMAIL` and `TEST_PASSWORD` with actual credentials.

Expected: Redirects to `/search` (or `/onboarding` if no pets exist yet).

- [ ] **Step 5: Wait for redirect and verify login**

```bash
browser-use wait text "Search" --timeout 5000
browser-use state
```

Expected: URL shows `/search` or `/onboarding`. User is authenticated.

- [ ] **Step 6: Delete existing pets (if any) for clean demo data**

If there are existing pets, navigate to Profile > Pets and delete them first to start fresh:

```bash
browser-use open http://localhost:3000/profile/pets
browser-use state
```

If pet cards are visible, delete each one by clicking delete button and confirming the dialog. Repeat until the pets list is empty. If no pets exist, skip to Step 7.

- [ ] **Step 7: Navigate to onboarding to create first pet (Luna)**

```bash
browser-use open http://localhost:3000/onboarding
browser-use state
```

Expected: Pet creation form with empty fields.

- [ ] **Step 8: Upload photo for Luna**

Find the file input / photo picker element from `browser-use state`:

```bash
browser-use upload <photo_input_index> /tmp/petpal-demo-photos/luna.jpg
```

Expected: Photo preview appears in the form.

- [ ] **Step 9: Fill in Luna's details**

Use `browser-use state` to discover element indices, then:

```bash
# Pet name
browser-use input <name_index> "Luna"

# Breed — this is a dropdown/selector, find and interact
browser-use click <breed_selector_index>
browser-use state  # See breed options
# Search/select "Golden Retriever"
browser-use input <breed_search_index> "Golden Retriever"
browser-use click <golden_retriever_option_index>

# Age in months
browser-use input <age_index> "24"

# Weight in kg
browser-use input <weight_index> "28"

# Gender — click "Female" radio button
browser-use click <female_radio_index>

# Neutered/Spayed — check the checkbox
browser-use click <neutered_checkbox_index>

# Activity Level — click "Active"
browser-use click <active_level_index>

# BCS — set to 5 (ideal). This is a slider, use the BCS selector component.
browser-use click <bcs_5_index>
```

Note: The exact indices will vary. Always run `browser-use state` between complex interactions to get fresh indices.

- [ ] **Step 10: Submit Luna's form**

```bash
browser-use state  # Find submit button
browser-use click <submit_button_index>
```

Expected: Pet created, redirects to `/search`.

- [ ] **Step 11: Create second pet (Milo) — navigate to add pet**

```bash
browser-use open http://localhost:3000/profile/pets
browser-use state  # Find "Add Pet" button
browser-use click <add_pet_button_index>
```

Expected: Navigates to `/onboarding` with empty form.

- [ ] **Step 12: Fill in Milo's details**

Same interaction pattern as Steps 8-10 but with Milo's data:
- Photo: `/tmp/petpal-demo-photos/milo.jpg`
- Name: "Milo"
- Breed: "French Bulldog"
- Age: 14 months
- Weight: 12 kg
- Gender: Male
- Neutered: Yes
- Activity: Moderate
- BCS: 6

Submit the form.

- [ ] **Step 13: Create third pet (Bella)**

Same interaction pattern:
- Photo: `/tmp/petpal-demo-photos/bella.jpg`
- Name: "Bella"
- Breed: "Labrador"
- Age: 8 months
- Weight: 18 kg
- Gender: Female
- Neutered: No
- Activity: Very Active
- BCS: 4

Submit the form.

- [ ] **Step 14: Verify all 3 pets exist**

```bash
browser-use open http://localhost:3000/profile/pets
browser-use state
```

Expected: 3 pet cards visible — Luna (Golden Retriever), Milo (French Bulldog), Bella (Labrador). All with photos.

- [ ] **Step 15: Select Luna as the active pet**

Navigate to search and ensure Luna is the selected pet (she should appear in the pet selector):

```bash
browser-use open http://localhost:3000/search
browser-use state
```

Expected: Luna shown in pet selector at top of search page.

---

## Task 5: Desktop Screenshots — 1440px Viewport

**Depends on:** Task 4 (demo data exists)

Capture all 19 screens at 1440x900 viewport using browser-use.

- [ ] **Step 1: Set viewport to 1440x900**

```bash
browser-use python "
page = await browser._session.get_current_page()
await page.set_viewport_size({'width': 1440, 'height': 900})
"
```

Expected: Viewport resized.

- [ ] **Step 2: Log out for auth screenshots**

```bash
browser-use open http://localhost:3000/profile
browser-use state  # Find "Sign Out" button
browser-use click <signout_button_index>
```

Expected: Redirects to `/login`.

- [ ] **Step 3: Capture Login screen**

```bash
browser-use open http://localhost:3000/login
browser-use wait text "Sign In" --timeout 5000
browser-use screenshot screenshots/desktop/1440/auth/login.png
```

Expected: `screenshots/desktop/1440/auth/login.png` created.

- [ ] **Step 4: Capture Register screen**

```bash
browser-use open http://localhost:3000/register
browser-use wait text "Sign Up" --timeout 5000
browser-use screenshot screenshots/desktop/1440/auth/register.png
```

Expected: `screenshots/desktop/1440/auth/register.png` created.

- [ ] **Step 5: Capture Forgot Password screen**

```bash
browser-use open http://localhost:3000/forgot-password
browser-use wait text "Reset" --timeout 5000
browser-use screenshot screenshots/desktop/1440/auth/forgot-password.png
```

Expected: `screenshots/desktop/1440/auth/forgot-password.png` created.

- [ ] **Step 6: Log in**

```bash
browser-use open http://localhost:3000/login
browser-use state
browser-use input <email_index> "TEST_EMAIL"
browser-use input <password_index> "TEST_PASSWORD"
browser-use click <signin_button_index>
browser-use wait text "Search" --timeout 10000
```

Expected: Logged in, at `/search`.

- [ ] **Step 7: Capture Search Home (Categories)**

```bash
browser-use open http://localhost:3000/search
browser-use wait selector "[class*='grid']" --timeout 5000
browser-use screenshot screenshots/desktop/1440/search/home-categories.png
```

Expected: Screenshot shows pet selector, search bar, category grid.

- [ ] **Step 8: Capture Search Results**

```bash
browser-use state  # Find search input
browser-use input <search_input_index> "chicken"
# Wait for debounce + results
browser-use wait text "result" --timeout 5000
browser-use screenshot screenshots/desktop/1440/search/search-results.png
```

Expected: Screenshot shows search results with food cards and safety badges.

- [ ] **Step 9: Capture Search No Results**

```bash
# Clear search and type non-matching query
browser-use state
browser-use click <search_input_index>
browser-use keys "Control+a"
browser-use type "xyzfoodnotfound"
browser-use wait text "Request" --timeout 5000
browser-use screenshot screenshots/desktop/1440/search/search-no-results.png
```

Expected: Screenshot shows no results state with "Request Food" button.

- [ ] **Step 10: Capture Food Request Dialog**

```bash
browser-use state  # Find "Request Food" button
browser-use click <request_food_button_index>
browser-use wait text "Request Food" --timeout 3000
browser-use screenshot screenshots/desktop/1440/search/food-request-dialog.png
```

Expected: Screenshot shows the food request modal open.

Close the dialog:

```bash
browser-use state  # Find cancel/close button
browser-use click <cancel_button_index>
```

- [ ] **Step 11: Capture Category Browse**

Navigate to a category with mixed safety levels:

```bash
browser-use open http://localhost:3000/search
browser-use wait selector "[class*='grid']" --timeout 5000
browser-use state  # Find a category card (e.g., "Fruits" or "Vegetables")
browser-use click <category_card_index>
browser-use wait selector "[class*='card']" --timeout 5000
browser-use screenshot screenshots/desktop/1440/search/category-browse.png
```

Expected: Screenshot shows category header with safety badge breakdown and food list.

- [ ] **Step 12: Capture Food Detail**

From the category browse page, click a food item that has all content sections (dangerous parts, preparation, warnings, benefits):

```bash
browser-use state  # Find a food card
browser-use click <food_card_index>
browser-use wait selector "[class*='badge']" --timeout 5000
browser-use screenshot screenshots/desktop/1440/search/food-detail.png
```

Expected: Screenshot shows food name, safety badge, and all content sections.

- [ ] **Step 13: Capture Scan tab (placeholder)**

```bash
browser-use open http://localhost:3000/scan
browser-use wait text "Scan" --timeout 5000
browser-use screenshot screenshots/desktop/1440/tabs/scan.png
```

- [ ] **Step 14: Capture Bowl tab (placeholder)**

```bash
browser-use open http://localhost:3000/bowl
browser-use wait text "Home Cooking" --timeout 5000
browser-use screenshot screenshots/desktop/1440/tabs/bowl.png
```

- [ ] **Step 15: Capture Learn tab (placeholder)**

```bash
browser-use open http://localhost:3000/learn
browser-use wait text "Knowledge" --timeout 5000
browser-use screenshot screenshots/desktop/1440/tabs/learn.png
```

- [ ] **Step 16: Capture Profile Main**

```bash
browser-use open http://localhost:3000/profile
browser-use wait text "Profile" --timeout 5000
browser-use screenshot screenshots/desktop/1440/profile/main.png
```

- [ ] **Step 17: Capture Pets List**

```bash
browser-use open http://localhost:3000/profile/pets
browser-use wait text "Luna" --timeout 5000
browser-use screenshot screenshots/desktop/1440/profile/pets-list.png
```

Expected: Screenshot shows 3 pet cards with photos and edit/delete buttons.

- [ ] **Step 18: Capture Pet Edit**

```bash
browser-use state  # Find edit button for Luna
browser-use click <edit_button_index>
browser-use wait text "Edit Pet" --timeout 5000
browser-use screenshot screenshots/desktop/1440/profile/pet-edit.png
```

Expected: Screenshot shows pre-filled pet form for Luna.

- [ ] **Step 19: Capture Pet Delete Dialog**

Navigate back to pets list and trigger delete confirmation:

```bash
browser-use open http://localhost:3000/profile/pets
browser-use wait text "Luna" --timeout 5000
browser-use state  # Find delete button for any pet (NOT Luna — we want to keep her)
browser-use click <delete_button_for_bella_index>
browser-use wait text "Delete Pet" --timeout 3000
browser-use screenshot screenshots/desktop/1440/profile/pet-delete-dialog.png
```

**IMPORTANT:** After capturing, dismiss the dialog without confirming the delete:

```bash
browser-use state  # Find cancel button
browser-use click <cancel_button_index>
```

- [ ] **Step 20: Capture Language page**

```bash
browser-use open http://localhost:3000/profile/language
browser-use wait text "English" --timeout 5000
browser-use screenshot screenshots/desktop/1440/profile/language.png
```

- [ ] **Step 21: Capture Scan History (placeholder)**

```bash
browser-use open http://localhost:3000/profile/scan-history
browser-use wait text "Coming Soon" --timeout 5000
browser-use screenshot screenshots/desktop/1440/profile/scan-history.png
```

- [ ] **Step 22: Capture Onboarding (empty pet form)**

Navigate to onboarding via the add pet flow:

```bash
browser-use open http://localhost:3000/onboarding
browser-use wait selector "form" --timeout 5000
browser-use screenshot screenshots/desktop/1440/onboarding/pet-creation.png
```

Expected: Screenshot shows empty pet creation form.

- [ ] **Step 23: Verify all 1440px screenshots**

```bash
ls -la screenshots/desktop/1440/auth/
ls -la screenshots/desktop/1440/onboarding/
ls -la screenshots/desktop/1440/search/
ls -la screenshots/desktop/1440/tabs/
ls -la screenshots/desktop/1440/profile/
```

Expected: 19 PNG files total across all subdirectories, all with non-zero file sizes.

---

## Task 6: Desktop Screenshots — 768px Viewport

**Depends on:** Task 5 (browser session still active and logged in)

Same screens as Task 5 but at 768x1024 viewport (tablet portrait).

- [ ] **Step 1: Resize viewport to 768x1024**

```bash
browser-use python "
page = await browser._session.get_current_page()
await page.set_viewport_size({'width': 768, 'height': 1024})
"
```

- [ ] **Step 2: Log out for auth screenshots**

```bash
browser-use open http://localhost:3000/profile
browser-use state
browser-use click <signout_button_index>
```

- [ ] **Step 3: Capture auth screens (login, register, forgot-password)**

```bash
browser-use open http://localhost:3000/login
browser-use wait text "Sign In" --timeout 5000
browser-use screenshot screenshots/desktop/768/auth/login.png

browser-use open http://localhost:3000/register
browser-use wait text "Sign Up" --timeout 5000
browser-use screenshot screenshots/desktop/768/auth/register.png

browser-use open http://localhost:3000/forgot-password
browser-use wait text "Reset" --timeout 5000
browser-use screenshot screenshots/desktop/768/auth/forgot-password.png
```

- [ ] **Step 4: Log in**

```bash
browser-use open http://localhost:3000/login
browser-use state
browser-use input <email_index> "TEST_EMAIL"
browser-use input <password_index> "TEST_PASSWORD"
browser-use click <signin_button_index>
browser-use wait text "Search" --timeout 10000
```

- [ ] **Step 5: Capture search flow screens**

```bash
# Home categories
browser-use open http://localhost:3000/search
browser-use wait selector "[class*='grid']" --timeout 5000
browser-use screenshot screenshots/desktop/768/search/home-categories.png

# Search results
browser-use state
browser-use input <search_input_index> "chicken"
browser-use wait text "result" --timeout 5000
browser-use screenshot screenshots/desktop/768/search/search-results.png

# No results
browser-use click <search_input_index>
browser-use keys "Control+a"
browser-use type "xyzfoodnotfound"
browser-use wait text "Request" --timeout 5000
browser-use screenshot screenshots/desktop/768/search/search-no-results.png

# Food request dialog
browser-use state
browser-use click <request_food_button_index>
browser-use wait text "Request Food" --timeout 3000
browser-use screenshot screenshots/desktop/768/search/food-request-dialog.png
browser-use state
browser-use click <cancel_button_index>

# Category browse
browser-use open http://localhost:3000/search
browser-use wait selector "[class*='grid']" --timeout 5000
browser-use state
browser-use click <category_card_index>
browser-use wait selector "[class*='card']" --timeout 5000
browser-use screenshot screenshots/desktop/768/search/category-browse.png

# Food detail
browser-use state
browser-use click <food_card_index>
browser-use wait selector "[class*='badge']" --timeout 5000
browser-use screenshot screenshots/desktop/768/search/food-detail.png
```

- [ ] **Step 6: Capture tab placeholder screens**

```bash
browser-use open http://localhost:3000/scan
browser-use wait text "Scan" --timeout 5000
browser-use screenshot screenshots/desktop/768/tabs/scan.png

browser-use open http://localhost:3000/bowl
browser-use wait text "Home Cooking" --timeout 5000
browser-use screenshot screenshots/desktop/768/tabs/bowl.png

browser-use open http://localhost:3000/learn
browser-use wait text "Knowledge" --timeout 5000
browser-use screenshot screenshots/desktop/768/tabs/learn.png
```

- [ ] **Step 7: Capture profile flow screens**

```bash
# Profile main
browser-use open http://localhost:3000/profile
browser-use wait text "Profile" --timeout 5000
browser-use screenshot screenshots/desktop/768/profile/main.png

# Pets list
browser-use open http://localhost:3000/profile/pets
browser-use wait text "Luna" --timeout 5000
browser-use screenshot screenshots/desktop/768/profile/pets-list.png

# Pet edit
browser-use state
browser-use click <edit_button_index>
browser-use wait text "Edit Pet" --timeout 5000
browser-use screenshot screenshots/desktop/768/profile/pet-edit.png

# Pet delete dialog
browser-use open http://localhost:3000/profile/pets
browser-use wait text "Luna" --timeout 5000
browser-use state
browser-use click <delete_button_for_bella_index>
browser-use wait text "Delete Pet" --timeout 3000
browser-use screenshot screenshots/desktop/768/profile/pet-delete-dialog.png
browser-use state
browser-use click <cancel_button_index>

# Language
browser-use open http://localhost:3000/profile/language
browser-use wait text "English" --timeout 5000
browser-use screenshot screenshots/desktop/768/profile/language.png

# Scan history
browser-use open http://localhost:3000/profile/scan-history
browser-use wait text "Coming Soon" --timeout 5000
browser-use screenshot screenshots/desktop/768/profile/scan-history.png

# Onboarding
browser-use open http://localhost:3000/onboarding
browser-use wait selector "form" --timeout 5000
browser-use screenshot screenshots/desktop/768/onboarding/pet-creation.png
```

- [ ] **Step 8: Verify all 768px screenshots**

```bash
find screenshots/desktop/768 -name "*.png" | wc -l
```

Expected: 19

- [ ] **Step 9: Close browser session**

```bash
browser-use close
```

---

## Task 7: iOS Screenshots — iPhone SE

**Depends on:** Task 3 (iOS built, iPhone SE simulator created), Task 4 (demo data exists in Supabase)

Capture all 19 screens on iPhone SE (3rd generation) simulator.

**Convention for this task and Tasks 8-9:**
- `$UDID` = the simulator's UDID
- `$APP_PATH` = path to the built .app bundle from Task 3
- `$SCRIPTS` = `.claude/skills/ios-debug/scripts`
- `$OUT` = output screenshot directory for this device

- [ ] **Step 1: Boot iPhone SE simulator**

```bash
cd /Users/hamzasahin/src/petpal/web
python3 .claude/skills/ios-debug/scripts/simctl_boot.py --name "PawBalance iPhone SE" --wait-ready --timeout 60
```

Expected: Simulator booted and ready.

- [ ] **Step 2: Set clean status bar**

```bash
python3 .claude/skills/ios-debug/scripts/status_bar.py --preset clean --name "PawBalance iPhone SE"
```

Expected: Status bar shows 9:41, full battery, full signal.

- [ ] **Step 3: Install the app**

```bash
# Use the APP_PATH from Task 3 Step 4
python3 .claude/skills/ios-debug/scripts/app_launcher.py --install "$APP_PATH" --name "PawBalance iPhone SE"
```

Expected: App installed on simulator.

- [ ] **Step 4: Launch the app**

```bash
python3 .claude/skills/ios-debug/scripts/app_launcher.py --launch com.pawbalance.app --name "PawBalance iPhone SE"
```

Expected: App opens to login screen (no session).

- [ ] **Step 5: Wait for app to load and capture Login screen**

```bash
sleep 3  # Wait for app to fully render
SE_UDID=$(xcrun simctl list devices | grep "PawBalance iPhone SE" | grep -oE '[A-F0-9-]{36}')
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/auth/login.png
```

Expected: Login screen screenshot saved.

- [ ] **Step 6: Navigate to Register and capture**

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign Up" --tap --name "PawBalance iPhone SE"
sleep 2
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/auth/register.png
```

- [ ] **Step 7: Navigate to Forgot Password and capture**

Go back to login first, then navigate to forgot password:

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign In" --tap --name "PawBalance iPhone SE"
sleep 1
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Forgot" --tap --name "PawBalance iPhone SE"
sleep 2
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/auth/forgot-password.png
```

- [ ] **Step 8: Log in**

Navigate back to login page:

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign In" --tap --name "PawBalance iPhone SE"
sleep 1
```

Enter credentials:

```bash
# Tap email field and type
python3 .claude/skills/ios-debug/scripts/navigator.py --find-type textField --tap --index 0 --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/keyboard.py --type "TEST_EMAIL" --name "PawBalance iPhone SE"

# Tap password field and type
python3 .claude/skills/ios-debug/scripts/navigator.py --find-type secureTextField --tap --index 0 --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/keyboard.py --type "TEST_PASSWORD" --name "PawBalance iPhone SE"

# Dismiss keyboard and tap sign in
python3 .claude/skills/ios-debug/scripts/keyboard.py --dismiss --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign In" --tap --name "PawBalance iPhone SE"
sleep 5  # Wait for auth + redirect
```

Expected: App navigates to `/search` with demo data visible.

- [ ] **Step 9: Capture Search Home (Categories)**

```bash
sleep 2
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/search/home-categories.png
```

- [ ] **Step 10: Capture Search Results**

```bash
# Tap search bar and type "chicken"
python3 .claude/skills/ios-debug/scripts/navigator.py --find-type textField --tap --index 0 --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/keyboard.py --type "chicken" --name "PawBalance iPhone SE"
sleep 2  # Wait for debounce + results
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/search/search-results.png
```

- [ ] **Step 11: Capture Search No Results**

```bash
# Clear and type non-matching query
python3 .claude/skills/ios-debug/scripts/navigator.py --find-type textField --tap --index 0 --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/keyboard.py --clear --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/keyboard.py --type "xyzfoodnotfound" --name "PawBalance iPhone SE"
sleep 2
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/search/search-no-results.png
```

- [ ] **Step 12: Capture Food Request Dialog**

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Request" --tap --name "PawBalance iPhone SE"
sleep 1
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/search/food-request-dialog.png
```

Dismiss the dialog:

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Cancel" --tap --name "PawBalance iPhone SE"
sleep 1
```

- [ ] **Step 13: Capture Category Browse**

Navigate back to search home and tap a category:

```bash
# Clear search to go back to categories
python3 .claude/skills/ios-debug/scripts/navigator.py --find-type textField --tap --index 0 --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/keyboard.py --clear --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/keyboard.py --dismiss --name "PawBalance iPhone SE"
sleep 2

# Use screen_mapper to find a category card
python3 .claude/skills/ios-debug/scripts/screen_mapper.py --name "PawBalance iPhone SE"

# Tap a category (e.g., Fruits or Vegetables — pick one from screen_mapper output)
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "<CATEGORY_NAME>" --tap --name "PawBalance iPhone SE"
sleep 2
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/search/category-browse.png
```

- [ ] **Step 14: Capture Food Detail**

From category browse, tap a food item:

```bash
python3 .claude/skills/ios-debug/scripts/screen_mapper.py --name "PawBalance iPhone SE"
# Find a food card and tap it
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "<FOOD_NAME>" --tap --name "PawBalance iPhone SE"
sleep 2
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/search/food-detail.png
```

- [ ] **Step 15: Capture Scan tab**

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-id "tab-scan" --tap --name "PawBalance iPhone SE"
sleep 1
# Alternative if no accessibility ID: tap by text or use bottom nav coordinates
python3 .claude/skills/ios-debug/scripts/screen_mapper.py --name "PawBalance iPhone SE"
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/tabs/scan.png
```

Note: Bottom nav tabs may not have text labels visible. Use `screen_mapper.py` to find the correct elements. Tab order is: Scan, Bowl, Search (center), Learn, Profile.

- [ ] **Step 16: Capture Bowl tab**

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Bowl" --tap --name "PawBalance iPhone SE"
sleep 1
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/tabs/bowl.png
```

If "Bowl" text not visible in nav, navigate via URL or use the second nav tab icon.

- [ ] **Step 17: Capture Learn tab**

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Learn" --tap --name "PawBalance iPhone SE"
sleep 1
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/tabs/learn.png
```

- [ ] **Step 18: Capture Profile Main**

```bash
# Tap profile tab (last in bottom nav)
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Profile" --tap --name "PawBalance iPhone SE"
sleep 1
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/profile/main.png
```

- [ ] **Step 19: Capture Pets List**

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Pets" --tap --name "PawBalance iPhone SE"
sleep 2
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/profile/pets-list.png
```

- [ ] **Step 20: Capture Pet Edit**

```bash
# Tap edit button on first pet (Luna)
python3 .claude/skills/ios-debug/scripts/screen_mapper.py --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Edit" --tap --index 0 --name "PawBalance iPhone SE"
sleep 2
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/profile/pet-edit.png
```

- [ ] **Step 21: Capture Pet Delete Dialog**

Navigate back to pets list and trigger delete:

```bash
# Go back
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Back" --tap --name "PawBalance iPhone SE"
sleep 1

# Tap delete on a pet (NOT Luna)
python3 .claude/skills/ios-debug/scripts/screen_mapper.py --name "PawBalance iPhone SE"
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Delete" --tap --name "PawBalance iPhone SE"
sleep 1
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/profile/pet-delete-dialog.png

# Dismiss without confirming
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Cancel" --tap --name "PawBalance iPhone SE"
```

- [ ] **Step 22: Capture Language page**

```bash
# Go back to profile
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Profile" --tap --name "PawBalance iPhone SE"
sleep 1
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Language" --tap --name "PawBalance iPhone SE"
sleep 1
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/profile/language.png
```

- [ ] **Step 23: Capture Scan History (placeholder)**

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Back" --tap --name "PawBalance iPhone SE"
sleep 1
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Scan History" --tap --name "PawBalance iPhone SE"
sleep 1
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/profile/scan-history.png
```

- [ ] **Step 24: Capture Onboarding (empty pet form)**

```bash
# Navigate: Profile > Pets > Add Pet
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Back" --tap --name "PawBalance iPhone SE"
sleep 1
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Pets" --tap --name "PawBalance iPhone SE"
sleep 1
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Add" --tap --name "PawBalance iPhone SE"
sleep 2
xcrun simctl io "$SE_UDID" screenshot screenshots/ios/iphone-se/onboarding/pet-creation.png
```

- [ ] **Step 25: Verify and shutdown**

```bash
find screenshots/ios/iphone-se -name "*.png" | wc -l
```

Expected: 19

```bash
python3 .claude/skills/ios-debug/scripts/simctl_shutdown.py --name "PawBalance iPhone SE" --verify
```

---

## Task 8: iOS Screenshots — iPhone 16

**Depends on:** Task 3 (iOS built), Task 4 (demo data exists)

Same 19 screens as Task 7 but on iPhone 16 simulator.

**UDID:** `DBCBEB59-81CD-403D-BE0F-B54AA8EB7736`

- [ ] **Step 1: Boot iPhone 16 simulator**

```bash
cd /Users/hamzasahin/src/petpal/web
python3 .claude/skills/ios-debug/scripts/simctl_boot.py --udid "DBCBEB59-81CD-403D-BE0F-B54AA8EB7736" --wait-ready --timeout 60
```

- [ ] **Step 2: Set clean status bar and install app**

```bash
python3 .claude/skills/ios-debug/scripts/status_bar.py --preset clean --udid "DBCBEB59-81CD-403D-BE0F-B54AA8EB7736"
python3 .claude/skills/ios-debug/scripts/app_launcher.py --install "$APP_PATH" --udid "DBCBEB59-81CD-403D-BE0F-B54AA8EB7736"
python3 .claude/skills/ios-debug/scripts/app_launcher.py --launch com.pawbalance.app --udid "DBCBEB59-81CD-403D-BE0F-B54AA8EB7736"
```

- [ ] **Step 3: Capture all auth screens (login, register, forgot-password)**

Follow the same navigation pattern as Task 7 Steps 5-7, but:
- Replace `--name "PawBalance iPhone SE"` with `--udid "DBCBEB59-81CD-403D-BE0F-B54AA8EB7736"`
- Save screenshots to `screenshots/ios/iphone-16/auth/` instead

```bash
UDID="DBCBEB59-81CD-403D-BE0F-B54AA8EB7736"
sleep 3

# Login
xcrun simctl io "$UDID" screenshot screenshots/ios/iphone-16/auth/login.png

# Navigate to Register
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign Up" --tap --udid "$UDID"
sleep 2
xcrun simctl io "$UDID" screenshot screenshots/ios/iphone-16/auth/register.png

# Navigate to Forgot Password
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign In" --tap --udid "$UDID"
sleep 1
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Forgot" --tap --udid "$UDID"
sleep 2
xcrun simctl io "$UDID" screenshot screenshots/ios/iphone-16/auth/forgot-password.png
```

- [ ] **Step 4: Log in**

Same pattern as Task 7 Step 8 with `--udid "$UDID"`:

```bash
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign In" --tap --udid "$UDID"
sleep 1
python3 .claude/skills/ios-debug/scripts/navigator.py --find-type textField --tap --index 0 --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/keyboard.py --type "TEST_EMAIL" --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/navigator.py --find-type secureTextField --tap --index 0 --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/keyboard.py --type "TEST_PASSWORD" --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/keyboard.py --dismiss --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign In" --tap --udid "$UDID"
sleep 5
```

- [ ] **Step 5: Capture all authenticated screens**

Follow the exact same navigation and capture sequence as Task 7 Steps 9-24, but:
- Replace all `--name "PawBalance iPhone SE"` with `--udid "DBCBEB59-81CD-403D-BE0F-B54AA8EB7736"`
- Replace all output paths from `screenshots/ios/iphone-se/` to `screenshots/ios/iphone-16/`
- Replace `$SE_UDID` with `DBCBEB59-81CD-403D-BE0F-B54AA8EB7736`

Screens to capture (in order):
1. `screenshots/ios/iphone-16/search/home-categories.png`
2. `screenshots/ios/iphone-16/search/search-results.png` (search "chicken")
3. `screenshots/ios/iphone-16/search/search-no-results.png` (search "xyzfoodnotfound")
4. `screenshots/ios/iphone-16/search/food-request-dialog.png` (tap Request, then Cancel)
5. `screenshots/ios/iphone-16/search/category-browse.png` (clear search, tap category)
6. `screenshots/ios/iphone-16/search/food-detail.png` (tap a food item)
7. `screenshots/ios/iphone-16/tabs/scan.png`
8. `screenshots/ios/iphone-16/tabs/bowl.png`
9. `screenshots/ios/iphone-16/tabs/learn.png`
10. `screenshots/ios/iphone-16/profile/main.png`
11. `screenshots/ios/iphone-16/profile/pets-list.png`
12. `screenshots/ios/iphone-16/profile/pet-edit.png`
13. `screenshots/ios/iphone-16/profile/pet-delete-dialog.png` (Cancel after capture!)
14. `screenshots/ios/iphone-16/profile/language.png`
15. `screenshots/ios/iphone-16/profile/scan-history.png`
16. `screenshots/ios/iphone-16/onboarding/pet-creation.png`

- [ ] **Step 6: Verify and shutdown**

```bash
find screenshots/ios/iphone-16 -name "*.png" | wc -l
```

Expected: 19

```bash
python3 .claude/skills/ios-debug/scripts/simctl_shutdown.py --udid "DBCBEB59-81CD-403D-BE0F-B54AA8EB7736" --verify
```

---

## Task 9: iOS Screenshots — iPhone 16 Pro Max

**Depends on:** Task 3 (iOS built), Task 4 (demo data exists)

Same 19 screens on iPhone 16 Pro Max simulator.

**UDID:** `6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4`

- [ ] **Step 1: Boot iPhone 16 Pro Max simulator**

```bash
cd /Users/hamzasahin/src/petpal/web
python3 .claude/skills/ios-debug/scripts/simctl_boot.py --udid "6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4" --wait-ready --timeout 60
```

- [ ] **Step 2: Set clean status bar and install app**

```bash
UDID="6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4"
python3 .claude/skills/ios-debug/scripts/status_bar.py --preset clean --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/app_launcher.py --install "$APP_PATH" --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/app_launcher.py --launch com.pawbalance.app --udid "$UDID"
```

- [ ] **Step 3: Capture all auth screens**

Same pattern as Task 8 Step 3 with `UDID="6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4"`, saving to `screenshots/ios/iphone-16-pro-max/auth/`.

```bash
UDID="6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4"
sleep 3

xcrun simctl io "$UDID" screenshot screenshots/ios/iphone-16-pro-max/auth/login.png

python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign Up" --tap --udid "$UDID"
sleep 2
xcrun simctl io "$UDID" screenshot screenshots/ios/iphone-16-pro-max/auth/register.png

python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign In" --tap --udid "$UDID"
sleep 1
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Forgot" --tap --udid "$UDID"
sleep 2
xcrun simctl io "$UDID" screenshot screenshots/ios/iphone-16-pro-max/auth/forgot-password.png
```

- [ ] **Step 4: Log in**

Same pattern as Task 8 Step 4 with `UDID="6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4"`.

```bash
UDID="6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4"
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign In" --tap --udid "$UDID"
sleep 1
python3 .claude/skills/ios-debug/scripts/navigator.py --find-type textField --tap --index 0 --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/keyboard.py --type "TEST_EMAIL" --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/navigator.py --find-type secureTextField --tap --index 0 --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/keyboard.py --type "TEST_PASSWORD" --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/keyboard.py --dismiss --udid "$UDID"
python3 .claude/skills/ios-debug/scripts/navigator.py --find-text "Sign In" --tap --udid "$UDID"
sleep 5
```

- [ ] **Step 5: Capture all authenticated screens**

Same sequence as Task 8 Step 5 with:
- `UDID="6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4"`
- Output paths: `screenshots/ios/iphone-16-pro-max/`

Screens (in order):
1. `screenshots/ios/iphone-16-pro-max/search/home-categories.png`
2. `screenshots/ios/iphone-16-pro-max/search/search-results.png`
3. `screenshots/ios/iphone-16-pro-max/search/search-no-results.png`
4. `screenshots/ios/iphone-16-pro-max/search/food-request-dialog.png`
5. `screenshots/ios/iphone-16-pro-max/search/category-browse.png`
6. `screenshots/ios/iphone-16-pro-max/search/food-detail.png`
7. `screenshots/ios/iphone-16-pro-max/tabs/scan.png`
8. `screenshots/ios/iphone-16-pro-max/tabs/bowl.png`
9. `screenshots/ios/iphone-16-pro-max/tabs/learn.png`
10. `screenshots/ios/iphone-16-pro-max/profile/main.png`
11. `screenshots/ios/iphone-16-pro-max/profile/pets-list.png`
12. `screenshots/ios/iphone-16-pro-max/profile/pet-edit.png`
13. `screenshots/ios/iphone-16-pro-max/profile/pet-delete-dialog.png`
14. `screenshots/ios/iphone-16-pro-max/profile/language.png`
15. `screenshots/ios/iphone-16-pro-max/profile/scan-history.png`
16. `screenshots/ios/iphone-16-pro-max/onboarding/pet-creation.png`

- [ ] **Step 6: Verify and shutdown**

```bash
find screenshots/ios/iphone-16-pro-max -name "*.png" | wc -l
```

Expected: 19

```bash
python3 .claude/skills/ios-debug/scripts/simctl_shutdown.py --udid "6E6DDF1C-6B1C-46F7-BC60-7FA8DADC92E4" --verify
```

---

## Task 10: Final Verification and Cleanup

**Depends on:** All previous tasks

- [ ] **Step 1: Count all screenshots**

```bash
cd /Users/hamzasahin/src/petpal/web
echo "=== Desktop 1440px ==="
find screenshots/desktop/1440 -name "*.png" | wc -l

echo "=== Desktop 768px ==="
find screenshots/desktop/768 -name "*.png" | wc -l

echo "=== iPhone SE ==="
find screenshots/ios/iphone-se -name "*.png" | wc -l

echo "=== iPhone 16 ==="
find screenshots/ios/iphone-16 -name "*.png" | wc -l

echo "=== iPhone 16 Pro Max ==="
find screenshots/ios/iphone-16-pro-max -name "*.png" | wc -l

echo "=== Total ==="
find screenshots/desktop screenshots/ios -name "*.png" | wc -l
```

Expected: 19 per viewport, 95 total.

- [ ] **Step 2: Check for zero-byte files**

```bash
find screenshots/ -name "*.png" -empty
```

Expected: No output (no empty files).

- [ ] **Step 3: List all files for review**

```bash
find screenshots/desktop screenshots/ios -name "*.png" | sort
```

Expected: 95 files in correct directory structure.

- [ ] **Step 4: Kill the local server**

```bash
pkill -f "serve out" || true
```

- [ ] **Step 5: Clean up temp files**

```bash
rm -rf /tmp/petpal-demo-photos
```

- [ ] **Step 6: Commit screenshots**

```bash
cd /Users/hamzasahin/src/petpal/web
git add screenshots/desktop/ screenshots/ios/
git commit -m "docs: add comprehensive UI/UX screenshot documentation

Capture all 19 screens across 5 viewports:
- Desktop: 1440px, 768px
- iOS: iPhone SE, iPhone 16, iPhone 16 Pro Max

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Parallelism Map

```
Task 1 (dirs + photos)
  ↓
Task 2 (build + serve)  ──────────→  Task 3 (iOS build + SE simulator)
  ↓                                       ↓
Task 4 (demo data via browser)       (iOS ready, waiting for data)
  ↓                                       ↓
  ├── Task 5 (desktop 1440)          Task 7 (iOS iPhone SE)
  │     ↓                            Task 8 (iOS iPhone 16) [after SE done]
  │   Task 6 (desktop 768)           Task 9 (iOS iPhone 16 Pro Max) [after 16 done]
  │     ↓                                 ↓
  └─────┴────────────────────────→ Task 10 (verification)
```

Tasks 5-6 (desktop) and Tasks 7-9 (iOS, sequential per device) can run **in parallel**.
