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

## Out of Scope

- Migrating PawBalance from Supabase Cloud to self-hosted (future consideration)
- Android support (deferred per CLAUDE.md)
- CI/CD pipeline for automatic bundle uploads (can be added later)
- High-availability / multi-node PostgreSQL (single node is sufficient for one app)
- Stripe/billing integration in Capgo (not needed for self-hosted single-developer use)
