# Self-Hosted Capgo Live Updates via GitOps

**Date:** 2026-03-30
**Status:** Draft
**Goal:** Enable OTA (over-the-air) updates for the PawBalance iOS app so that Next.js changes deploy instantly without requiring a new App Store build each time.

---

## Problem

PawBalance uses Capacitor with `output: 'export'` (static HTML/JS/CSS). Web assets are bundled into the iOS binary. Every Next.js change requires a full cycle: `npm run build` -> `cap sync` -> Xcode archive -> TestFlight upload -> App Store review. This is slow and unnecessary for web-only changes.

## Solution

Self-host Capgo — an open-source OTA update platform for Capacitor apps — on the existing K8s cluster using GitOps (ArgoCD + Helm). Capgo pushes web asset bundles directly to devices, bypassing the App Store for non-native changes.

---

## Architecture

```
K8s Cluster (*.optalgo.com)
├── PawBalance Web App        (existing, untouched)
├── Supabase (self-hosted)    Capgo backend only
│   ├── PostgreSQL 17
│   ├── PostgREST
│   ├── Kong (API gateway)
│   ├── GoTrue (Auth)
│   ├── Edge Runtime (Capgo functions)
│   ├── Studio (dashboard)
│   ├── Realtime, Supavisor, Vector, Logflare, imgproxy, meta
│   └── Storage (backed by MinIO)
├── MinIO                     S3-compatible storage (bundled in Supabase chart)
└── Capgo Web Console         Vue 3 app for managing updates

Supabase Cloud (existing, untouched)
└── PawBalance backend (pets, foods, auth)
```

### Data Flow

1. Developer runs `npm run build` and uploads the bundle via Capgo CLI
2. Bundle is stored in MinIO (S3-compatible) via Supabase Storage
3. Capgo edge functions register the bundle version in PostgreSQL
4. PawBalance iOS app checks for updates on launch via Supabase Edge Functions
5. If a new bundle is available, the app downloads it from MinIO (presigned URL)
6. Capacitor applies the update locally — no App Store involved

### What Stays Unchanged

- PawBalance's Supabase Cloud project (pets, foods, auth) is untouched
- The existing PawBalance GitOps deployment is untouched
- App Store builds are still used for native plugin changes (Capacitor, Camera, etc.)

---

## Domains

All domains use the existing wildcard certificate on `*.optalgo.com`.

| Service | Domain | Purpose |
|---------|--------|---------|
| Supabase Studio | `supabase.optalgo.com` | Self-hosted Supabase dashboard |
| Capgo Console | `capgo.optalgo.com` | Capgo update management UI |
| MinIO API | `minio.optalgo.com` | S3 API for bundle storage |
| MinIO Console | `minio-console.optalgo.com` | MinIO web UI for browsing storage |

All domains are configurable via Helm `values.yaml`.

---

## GitOps Repository Structure

```
gitops/
├── apps/
│   ├── pawbalance/
│   │   └── application.yaml              # existing, untouched
│   ├── supabase/
│   │   └── application.yaml              # ArgoCD app (Supabase + MinIO)
│   └── capgo-console/
│       └── application.yaml              # ArgoCD app
├── helm/
│   ├── pawbalance/                       # existing, untouched
│   ├── supabase/
│   │   ├── Chart.yaml                    # dependency: supabase-community/supabase
│   │   └── values.yaml                   # JWT, domains, MinIO config, etc.
│   └── capgo-console/
│       ├── Chart.yaml
│       ├── values.yaml                   # domain, image, Supabase connection
│       └── templates/
│           ├── _helpers.tpl
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── ingressroute.yaml         # capgo.optalgo.com
│           ├── certificate.yaml
│           ├── namespace.yaml
│           └── registry-secret.yaml
```

### Helm Charts Used

| Component | Chart Source | Type |
|-----------|-------------|------|
| Supabase (+ MinIO) | `supabase-community/supabase-kubernetes` | Community chart as dependency |
| Capgo Console | Custom chart in `helm/capgo-console/` | Same pattern as PawBalance (Vue static site + nginx) |
| PawBalance | Existing chart in `helm/pawbalance/` | Untouched |

---

## Component Details

### 1. Self-Hosted Supabase

**Chart:** `supabase-community/supabase-kubernetes` (v0.5.2+, 736 stars)

**Services deployed (12):** PostgreSQL 17, PostgREST, Kong, GoTrue (Auth), Edge Runtime, Studio, Realtime, Supavisor, Storage, imgproxy, postgres-meta, Vector/Logflare

**Key values.yaml configuration:**

```yaml
# Supabase secrets
jwt:
  secret: ""              # generated, signs all tokens
  anonKey: ""             # limited client access
  serviceRoleKey: ""      # full database access
database:
  password: ""            # PostgreSQL password
studio:
  domain: supabase.optalgo.com
  password: ""            # dashboard login

# MinIO (bundled subchart)
minio:
  enabled: true
  rootUser: ""
  rootPassword: ""
  defaultBuckets: "capgo"
  persistence:
    size: 10Gi

# Storage service points to MinIO
storage:
  s3:
    endpoint: "http://minio:9000"     # internal K8s DNS
    accessKey: ""                      # same as MinIO rootUser
    secretKey: ""                      # same as MinIO rootPassword
    bucket: "capgo"
    region: "us-east-1"
```

**MinIO exposure:** Both MinIO API (`minio.optalgo.com`) and MinIO Console (`minio-console.optalgo.com`) exposed via Traefik IngressRoutes. The Supabase community chart may need additional IngressRoute templates for MinIO, or these can be added as supplemental templates in the wrapper chart.

**PostgreSQL persistence:** PVC with configurable storage size (20 Gi default). Contains only Capgo data — PawBalance data remains on Supabase Cloud.

**Required PostgreSQL extensions:** `pg_cron`, `pg_net`, `http`, `pgmq`, `pgcrypto`, `supabase_vault`, `moddatetime`, `uuid-ossp`. All available since we control the Postgres instance.

### 2. Capgo Edge Functions

**Runtime:** Deployed inside the Supabase Edge Runtime container.

**Deployment method:** Use the Supabase CLI (`supabase functions deploy`) pointed at the self-hosted instance. The CLI pushes function code to the Edge Runtime via the Management API. This is the standard Supabase approach and avoids custom Docker image builds for function changes.

**Functions to deploy:** `updates`, `stats`, `channel_self`, `app`, `bundle`, `channel`, `device`, `build`, `organization`, `webhooks`, `triggers`, `private`

**Source:** `/refs/capgo/supabase/functions/`

**Configuration (environment variables for Edge Runtime):**

```
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=<minio root user>
S3_SECRET_ACCESS_KEY=<minio root password>
S3_BUCKET=capgo
S3_SSL=false
API_SECRET=<generated secret>
WEBAPP_URL=https://capgo.optalgo.com
```

**Database migrations:** Capgo's 218 migration files applied to the self-hosted PostgreSQL instance. Run via `supabase db push` or as init scripts in the PostgreSQL container.

### 3. Capgo Web Console

**Source:** Vue 3 app from `/refs/capgo/src/`

**Build:** Multi-stage Docker build (node -> nginx), same pattern as PawBalance.

**Dockerfile:**
```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**Image:** `registry.optalgo.com/capgo-console:latest`

**Configuration (baked at build time via env vars / configs.json override):**

```yaml
config:
  supabaseUrl: "https://supabase.optalgo.com"
  supabaseAnonKey: ""       # from self-hosted Supabase
  apiDomain: "supabase.optalgo.com/functions/v1"
  baseDomain: "capgo.optalgo.com"
```

**Helm values.yaml:**
```yaml
namespace: capgo-console
domain: capgo.optalgo.com
image:
  repository: registry.optalgo.com/capgo-console
  tag: latest
```

---

## PawBalance iOS App Integration

After the infrastructure is deployed, the PawBalance app needs the Capgo client SDK:

1. Install: `npm install @capgo/capacitor-updater`
2. Configure in `capacitor.config.ts`:
   ```typescript
   plugins: {
     CapacitorUpdater: {
       autoUpdate: true,
       statsUrl: "https://supabase.optalgo.com/functions/v1/stats",
       channelUrl: "https://supabase.optalgo.com/functions/v1/channel_self",
       updateUrl: "https://supabase.optalgo.com/functions/v1/updates",
     }
   }
   ```
3. Add update logic in `src/lib/platform.ts` (behind `isNative` check)
4. Upload bundles via CLI: `npx @capgo/cli upload --apikey <key> --channel production`

---

## Deployment Order

1. **Supabase + MinIO** — Deploy the Supabase Helm chart with MinIO enabled. Verify Studio is accessible at `supabase.optalgo.com`. Apply Capgo database migrations. Deploy Capgo edge functions.
2. **Capgo Console** — Build and push Docker image. Deploy Helm chart. Verify console loads at `capgo.optalgo.com` and connects to self-hosted Supabase.
3. **PawBalance Integration** — Install Capgo SDK in the app. Configure update URLs. Build and upload first bundle. Test OTA update on iOS simulator.

---

## Testing & Verification

- **Supabase health:** Studio loads, PostgREST returns data, Auth issues tokens
- **MinIO health:** Console accessible, bucket `capgo` exists, presigned URLs work
- **Capgo Console:** Loads, authenticates against self-hosted Supabase, lists apps
- **Edge Functions:** `/functions/v1/updates` returns valid response for update check
- **End-to-end:** Upload a bundle via CLI, verify iOS app downloads and applies it

---

## Security Considerations

- All secrets (JWT, MinIO credentials, API keys) stored as K8s Secrets, referenced in Helm values
- All traffic over HTTPS via Traefik + cert-manager
- MinIO bucket is private — access only via presigned URLs
- Supabase Studio protected by password
- Edge functions validate API keys and use RLS policies
- No PawBalance data at risk — self-hosted Supabase is completely separate

---

## Resource Requirements

**Supabase (13 containers):** ~4 GB RAM, 2 CPU cores minimum (8 GB / 4 cores recommended)
**MinIO:** ~512 MB RAM, 10 Gi storage
**Capgo Console:** ~128 MB RAM (static nginx)

**Total additional cluster load:** ~5 GB RAM, 2-3 CPU cores, 30 Gi storage

---

## CI/CD Automation

### Goal

Push to `master` and everything deploys automatically. No manual steps.

### Two Deployment Paths

```
git push to master
       │
       ▼
  GitHub Actions
       │
       ├── Always ──────────► npm run build → capgo bundle upload → OTA to devices
       │
       └── Native change? ──► cap sync ios → xcodebuild archive → TestFlight upload
```

Most commits are web-only (Next.js code, components, styles, translations). These deploy via Capgo OTA in seconds. Only native changes (new Capacitor plugin, iOS project changes, `capacitor.config.ts`) trigger a full App Store build.

### Smart Path Detection

Native build triggers when any of these paths change:
- `ios/`
- `capacitor.config.ts`
- `package.json` or `package-lock.json` (new native plugin dependency)

All other changes are web-only and deploy via OTA.

### Workflow: `.github/workflows/deploy.yml`

```yaml
name: Build and Deploy

on:
  push:
    branches: [master]

env:
  NODE_VERSION: '20'

jobs:
  # Always: build web assets
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: web-build
          path: out/

  # Always: deploy OTA via Capgo
  deploy-ota:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          name: web-build
          path: out/
      - name: Upload to Capgo
        run: npx @capgo/cli upload --channel production
        env:
          CAPGO_APIKEY: ${{ secrets.CAPGO_APIKEY }}
          CAPGO_URL: ${{ secrets.CAPGO_URL }}  # https://supabase.optalgo.com/functions/v1

  # Conditional: native build + TestFlight
  detect-native:
    runs-on: ubuntu-latest
    outputs:
      native_changed: ${{ steps.check.outputs.native_changed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - id: check
        run: |
          if git diff --name-only HEAD~1 HEAD | grep -qE '^(ios/|capacitor\.config\.ts|package\.json|package-lock\.json)'; then
            echo "native_changed=true" >> "$GITHUB_OUTPUT"
          else
            echo "native_changed=false" >> "$GITHUB_OUTPUT"
          fi

  deploy-testflight:
    runs-on: macos-latest
    needs: [build, detect-native]
    if: needs.detect-native.outputs.native_changed == 'true'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          name: web-build
          path: out/
      - name: Sync Capacitor
        run: npx cap sync ios
      - name: Import signing certificate
        env:
          CERTIFICATE_P12: ${{ secrets.CERTIFICATE_P12 }}
          CERTIFICATE_PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
          PROVISIONING_PROFILE: ${{ secrets.PROVISIONING_PROFILE }}
        run: |
          security create-keychain -p "" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "" build.keychain
          security set-keychain-settings -t 3600 -u build.keychain
          echo "$CERTIFICATE_P12" | base64 --decode > certificate.p12
          security import certificate.p12 -k build.keychain -P "$CERTIFICATE_PASSWORD" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" build.keychain
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo "$PROVISIONING_PROFILE" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/profile.mobileprovision
      - name: Archive
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath build/App.xcarchive \
            -destination 'generic/platform=iOS' \
            archive
      - name: Export IPA
        run: |
          cd ios/App
          xcodebuild -exportArchive \
            -archivePath build/App.xcarchive \
            -exportPath build/ \
            -exportOptionsPlist ExportOptions.plist
      - name: Upload to TestFlight
        env:
          APP_STORE_CONNECT_KEY_ID: "4NH42JUWM6"
          APP_STORE_CONNECT_ISSUER_ID: "0b5bf398-ce6b-47b4-988a-386910acf728"
          APP_STORE_CONNECT_P8: ${{ secrets.APP_STORE_CONNECT_P8 }}
        run: |
          mkdir -p ~/.private_keys
          echo "$APP_STORE_CONNECT_P8" | base64 --decode > ~/.private_keys/AuthKey_4NH42JUWM6.p8
          xcrun notarytool store-credentials "AC_PASSWORD" \
            --key ~/.private_keys/AuthKey_4NH42JUWM6.p8 \
            --key-id "$APP_STORE_CONNECT_KEY_ID" \
            --issuer "$APP_STORE_CONNECT_ISSUER_ID"
          xcrun altool --upload-app \
            --type ios \
            --file ios/App/build/*.ipa \
            --apiKey "$APP_STORE_CONNECT_KEY_ID" \
            --apiIssuer "$APP_STORE_CONNECT_ISSUER_ID"
```

### GitHub Secrets Required

| Secret | Description | How to get |
|--------|-------------|------------|
| `CAPGO_APIKEY` | Capgo API key for bundle uploads | Generated in Capgo console |
| `CAPGO_URL` | Self-hosted Supabase functions URL | `https://supabase.optalgo.com/functions/v1` |
| `CERTIFICATE_P12` | iOS distribution certificate (base64) | Export from Keychain, `base64 -i cert.p12` |
| `CERTIFICATE_PASSWORD` | Certificate password | Set during export |
| `PROVISIONING_PROFILE` | iOS provisioning profile (base64) | Download from Apple Developer, `base64 -i profile.mobileprovision` |
| `APP_STORE_CONNECT_P8` | App Store Connect API key (base64) | `base64 -i AuthKey_4NH42JUWM6.p8` |

### What Happens on Push

| Change type | OTA deploy | TestFlight build | User sees update |
|-------------|-----------|-----------------|-----------------|
| Edit a component | Yes | No | Next app launch |
| Change translations | Yes | No | Next app launch |
| Update styles | Yes | No | Next app launch |
| Add Capacitor plugin | Yes | Yes | After TestFlight install |
| Modify `ios/` project | Yes | Yes | After TestFlight install |

---

## Out of Scope

- Migrating PawBalance from Supabase Cloud to self-hosted (future consideration)
- Android support (deferred per CLAUDE.md)
- High-availability / multi-node PostgreSQL (single node is sufficient for one app)
- Stripe/billing integration in Capgo (not needed for self-hosted single-developer use)
