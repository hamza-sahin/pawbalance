# Self-Hosted Capgo Live Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy self-hosted Capgo OTA update infrastructure on K8s via GitOps, and integrate the Capgo SDK into the PawBalance iOS app so web-only changes deploy automatically without App Store builds.

**Architecture:** Self-hosted Supabase (community Helm chart with bundled MinIO) provides the backend. Capgo edge functions run inside Supabase's Edge Runtime. A custom-built Capgo Vue console is deployed as a static nginx container. The PawBalance app uses `@capgo/capacitor-updater` to check for and apply OTA updates. A GitHub Actions workflow automates bundle uploads on every push to master.

**Tech Stack:** Helm 3, ArgoCD, Traefik, cert-manager, supabase-community/supabase-kubernetes chart, MinIO (bundled), Supabase CLI, Capgo CLI, Vue 3 / Vite / Bun, Docker/nginx, GitHub Actions, `@capgo/capacitor-updater`

**Spec:** `docs/superpowers/specs/2026-03-30-capgo-self-hosted-design.md`

**GitOps repo:** `refs/gitops/` (local reference to `git@github.com:hamza-sahin/gitops.git`, branch `main`)

**Capgo repo:** `refs/capgo/` (local reference for edge functions and console source)

---

## File Structure

### GitOps repo (`refs/gitops/`)

```
helm/supabase/
├── Chart.yaml                         # Wrapper chart depending on supabase-community/supabase
└── values.yaml                        # All config: JWT, domains, MinIO, storage

helm/capgo-console/
├── Chart.yaml                         # Simple app chart
├── values.yaml                        # Domain, image, registry
└── templates/
    ├── _helpers.tpl                   # dockerconfigjson helper
    ├── namespace.yaml                 # capgo-console namespace
    ├── deployment.yaml                # nginx container serving Vue build
    ├── service.yaml                   # ClusterIP service
    ├── ingressroute.yaml              # capgo.optalgo.com via Traefik
    ├── certificate.yaml               # TLS cert via cert-manager
    └── registry-secret.yaml           # Private registry auth

helm/supabase/templates/               # Supplemental templates for the wrapper chart
├── minio-ingressroute.yaml            # minio.optalgo.com + minio-console.optalgo.com
└── minio-certificate.yaml             # TLS certs for MinIO domains

apps/supabase/
└── application.yaml                   # ArgoCD Application for Supabase + MinIO

apps/capgo-console/
└── application.yaml                   # ArgoCD Application for Capgo console
```

### Capgo console Docker build (built from `refs/capgo/`)

```
Dockerfile                             # Multi-stage: bun build → nginx serve
nginx.conf                             # SPA routing config
```

### PawBalance web app (`src/`)

```
capacitor.config.ts                    # Add CapacitorUpdater plugin config
src/lib/platform.ts                    # Add OTA update listener (isNative only)
.github/workflows/deploy.yml           # CI/CD: build → Capgo upload → conditional TestFlight
```

---

## Task 1: Supabase Helm Wrapper Chart

**Files:**
- Create: `refs/gitops/helm/supabase/Chart.yaml`
- Create: `refs/gitops/helm/supabase/values.yaml`

- [ ] **Step 1: Create the wrapper Chart.yaml**

```yaml
# refs/gitops/helm/supabase/Chart.yaml
apiVersion: v2
name: supabase
description: Self-hosted Supabase for Capgo OTA updates
type: application
version: 0.1.0
appVersion: "0.5.2"
dependencies:
  - name: supabase
    version: "0.5.2"
    repository: "https://supabase-community.github.io/supabase-kubernetes"
```

- [ ] **Step 2: Generate JWT secrets**

Run locally (not committed — values go into values.yaml):

```bash
# Generate JWT secret (32+ chars)
openssl rand -hex 32

# Generate anon key and service key using the JWT secret above
# Use https://supabase.com/docs/guides/self-hosting#api-keys or:
# Install jwt-cli: npm install -g jwt-cli
# Anon key (limited access):
jwt encode --secret "<jwt_secret>" '{"role":"anon","iss":"supabase","iat":1735689600,"exp":1893456000}'

# Service role key (full access):
jwt encode --secret "<jwt_secret>" '{"role":"service_role","iss":"supabase","iat":1735689600,"exp":1893456000}'
```

Record the three values: `jwt_secret`, `anon_key`, `service_role_key`.

- [ ] **Step 3: Create values.yaml**

```yaml
# refs/gitops/helm/supabase/values.yaml
supabase:
  secret:
    jwt:
      anonKey: "<generated_anon_key>"
      serviceKey: "<generated_service_role_key>"
      secret: "<generated_jwt_secret>"
    db:
      username: "postgres"
      password: "<generate_with_openssl_rand_hex_32>"
      database: "postgres"
    smtp:
      username: ""
      password: ""
    dashboard:
      username: "admin"
      password: "<generate_with_openssl_rand_hex_16>"
    s3:
      keyId: "capgo-minio-admin"
      accessKey: "<generate_with_openssl_rand_hex_32>"

  db:
    enabled: true
    replicaCount: 1
    persistence:
      enabled: true
      storageClass: ""
      size: 20Gi

  studio:
    enabled: true
    replicaCount: 1

  auth:
    enabled: true
    replicaCount: 1

  rest:
    enabled: true
    replicaCount: 1

  realtime:
    enabled: true
    replicaCount: 1

  meta:
    enabled: true
    replicaCount: 1

  storage:
    enabled: true
    replicaCount: 1

  imgproxy:
    enabled: true
    replicaCount: 1

  kong:
    enabled: true
    replicaCount: 1

  analytics:
    enabled: false

  vector:
    enabled: false

  functions:
    enabled: true
    replicaCount: 1

  minio:
    enabled: true
    replicaCount: 1
    persistence:
      enabled: true
      storageClass: ""
      size: 10Gi

  ingress:
    enabled: true
    className: "traefik"
    annotations: {}
    hosts:
      - host: "supabase.optalgo.com"
        paths:
          - path: "/"
            pathType: "Prefix"
    tls:
      - secretName: supabase-tls-secret
        hosts:
          - supabase.optalgo.com
```

- [ ] **Step 4: Verify Chart.yaml dependency resolution**

```bash
cd refs/gitops/helm/supabase
helm dependency update .
```

Expected: Downloads `supabase-0.5.2.tgz` into `charts/` directory.

- [ ] **Step 5: Commit**

```bash
cd refs/gitops
git add helm/supabase/
git commit -m "feat: add Supabase Helm wrapper chart for Capgo backend"
```

---

## Task 2: MinIO Ingress Templates

The Supabase community chart deploys MinIO but doesn't expose it via Traefik IngressRoute. Add supplemental templates to the wrapper chart.

**Files:**
- Create: `refs/gitops/helm/supabase/templates/minio-ingressroute.yaml`
- Create: `refs/gitops/helm/supabase/templates/minio-certificate.yaml`

- [ ] **Step 1: Create MinIO IngressRoute**

```yaml
# refs/gitops/helm/supabase/templates/minio-ingressroute.yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: minio-api-routes
  namespace: {{ .Release.Namespace }}
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`minio.optalgo.com`)
      kind: Rule
      services:
        - name: {{ .Release.Name }}-supabase-minio
          port: 9000
    - match: Host(`minio-console.optalgo.com`)
      kind: Rule
      services:
        - name: {{ .Release.Name }}-supabase-minio
          port: 9001
  tls:
    secretName: minio-tls-secret
```

- [ ] **Step 2: Create MinIO Certificate**

```yaml
# refs/gitops/helm/supabase/templates/minio-certificate.yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: minio-cert
  namespace: {{ .Release.Namespace }}
spec:
  secretName: minio-tls-secret
  duration: 2160h
  renewBefore: 360h
  isCA: false
  privateKey:
    algorithm: RSA
    encoding: PKCS1
    size: 2048
  usages:
    - server auth
    - client auth
  dnsNames:
    - minio.optalgo.com
    - minio-console.optalgo.com
  issuerRef:
    name: letsencrypt-production
    kind: ClusterIssuer
    group: cert-manager.io
```

- [ ] **Step 3: Verify templates render**

```bash
cd refs/gitops/helm/supabase
helm template test . --debug 2>&1 | grep -A 5 "minio-api-routes"
```

Expected: Rendered IngressRoute with `minio.optalgo.com` host match.

- [ ] **Step 4: Commit**

```bash
cd refs/gitops
git add helm/supabase/templates/
git commit -m "feat: add Traefik IngressRoutes for MinIO API and console"
```

---

## Task 3: ArgoCD Application for Supabase

**Files:**
- Create: `refs/gitops/apps/supabase/application.yaml`

- [ ] **Step 1: Create ArgoCD Application manifest**

```yaml
# refs/gitops/apps/supabase/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: supabase
  namespace: argocd
spec:
  destination:
    name: ''
    namespace: supabase
    server: 'https://kubernetes.default.svc'
  source:
    path: helm/supabase
    repoURL: 'git@github.com:hamza-sahin/gitops.git'
    targetRevision: main
    helm:
      valueFiles:
        - values.yaml
  sources: []
  project: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

- [ ] **Step 2: Commit**

```bash
cd refs/gitops
git add apps/supabase/
git commit -m "feat: add ArgoCD Application for self-hosted Supabase"
```

---

## Task 4: Capgo Console Dockerfile

Build the Capgo Vue console as a Docker image. No Dockerfile exists in the Capgo repo — we create one.

**Files:**
- Create: `refs/capgo/Dockerfile.selfhost`
- Create: `refs/capgo/nginx.selfhost.conf`

- [ ] **Step 1: Create nginx config for SPA routing**

```nginx
# refs/capgo/nginx.selfhost.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 2: Create multi-stage Dockerfile**

```dockerfile
# refs/capgo/Dockerfile.selfhost
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

ARG BASE_DOMAIN=capgo.optalgo.com
ARG SUPA_ANON=""
ARG SUPA_URL=https://supabase.optalgo.com
ARG API_DOMAIN=supabase.optalgo.com/functions/v1
ARG CAPTCHA_KEY=""

ENV BASE_DOMAIN=$BASE_DOMAIN
ENV SUPA_ANON=$SUPA_ANON
ENV SUPA_URL=$SUPA_URL
ENV API_DOMAIN=$API_DOMAIN
ENV CAPTCHA_KEY=$CAPTCHA_KEY
ENV BRANCH=prod

RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.selfhost.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Test the build locally**

```bash
cd refs/capgo
docker build -f Dockerfile.selfhost \
  --build-arg BASE_DOMAIN=capgo.optalgo.com \
  --build-arg SUPA_URL=https://supabase.optalgo.com \
  --build-arg API_DOMAIN=supabase.optalgo.com/functions/v1 \
  --build-arg SUPA_ANON="<your_generated_anon_key>" \
  -t capgo-console:test .
```

Expected: Build completes, image created.

- [ ] **Step 4: Verify the image serves correctly**

```bash
docker run --rm -p 8080:80 capgo-console:test &
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
# Expected: 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/some/spa/route
# Expected: 200 (SPA fallback)
docker stop $(docker ps -q --filter ancestor=capgo-console:test)
```

- [ ] **Step 5: Push to private registry**

```bash
docker tag capgo-console:test registry.optalgo.com/capgo-console:latest
docker push registry.optalgo.com/capgo-console:latest
```

- [ ] **Step 6: Commit the Dockerfile and nginx config**

```bash
cd refs/capgo
git add Dockerfile.selfhost nginx.selfhost.conf
git commit -m "feat: add self-hosted Docker build for Capgo console"
```

---

## Task 5: Capgo Console Helm Chart

**Files:**
- Create: `refs/gitops/helm/capgo-console/Chart.yaml`
- Create: `refs/gitops/helm/capgo-console/values.yaml`
- Create: `refs/gitops/helm/capgo-console/templates/_helpers.tpl`
- Create: `refs/gitops/helm/capgo-console/templates/namespace.yaml`
- Create: `refs/gitops/helm/capgo-console/templates/deployment.yaml`
- Create: `refs/gitops/helm/capgo-console/templates/service.yaml`
- Create: `refs/gitops/helm/capgo-console/templates/ingressroute.yaml`
- Create: `refs/gitops/helm/capgo-console/templates/certificate.yaml`
- Create: `refs/gitops/helm/capgo-console/templates/registry-secret.yaml`

- [ ] **Step 1: Create Chart.yaml**

```yaml
# refs/gitops/helm/capgo-console/Chart.yaml
apiVersion: v2
name: capgo-console
description: Capgo web console for managing OTA updates
type: application
version: 0.1.0
appVersion: "1.0.0"
```

- [ ] **Step 2: Create values.yaml**

```yaml
# refs/gitops/helm/capgo-console/values.yaml
namespace: capgo-console

replicaCount: 1

image:
  repository: registry.optalgo.com/capgo-console
  tag: latest

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  host: capgo.optalgo.com
  entryPoints:
    - websecure
  tlsSecretName: capgo-console-tls-secret

imageRegistry:
  server: registry.optalgo.com
  username: admin
  password: kC7qGuJcLoADMEHYhN/T
```

- [ ] **Step 3: Create _helpers.tpl**

```yaml
# refs/gitops/helm/capgo-console/templates/_helpers.tpl
{{- define "capgo-console.dockerconfigjson" -}}
{{- $server := .Values.imageRegistry.server -}}
{{- $username := .Values.imageRegistry.username -}}
{{- $password := .Values.imageRegistry.password -}}
{{- $auth := printf "%s:%s" $username $password | b64enc -}}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"auth\":\"%s\"}}}" $server $username $password $auth | b64enc -}}
{{- end -}}
```

- [ ] **Step 4: Create namespace.yaml**

```yaml
# refs/gitops/helm/capgo-console/templates/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .Values.namespace }}
  labels:
    name: {{ .Values.namespace }}
```

- [ ] **Step 5: Create deployment.yaml**

```yaml
# refs/gitops/helm/capgo-console/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: capgo-console
  namespace: {{ .Values.namespace }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: capgo-console
  template:
    metadata:
      labels:
        app: capgo-console
    spec:
      containers:
      - name: capgo-console
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: {{ .Values.service.port }}
      imagePullSecrets:
      - name: registry-secret
```

- [ ] **Step 6: Create service.yaml**

```yaml
# refs/gitops/helm/capgo-console/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: capgo-console
  namespace: {{ .Values.namespace }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.port }}
    protocol: TCP
  selector:
    app: capgo-console
```

- [ ] **Step 7: Create ingressroute.yaml**

```yaml
# refs/gitops/helm/capgo-console/templates/ingressroute.yaml
{{- if .Values.ingress.enabled -}}
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: capgo-console-routes
  namespace: {{ .Values.namespace }}
spec:
  entryPoints:
    {{- toYaml .Values.ingress.entryPoints | nindent 4 }}
  routes:
    - match: Host(`{{ .Values.ingress.host }}`)
      kind: Rule
      services:
        - name: capgo-console
          port: {{ .Values.service.port }}
  tls:
    secretName: {{ .Values.ingress.tlsSecretName }}
{{- end }}
```

- [ ] **Step 8: Create certificate.yaml**

```yaml
# refs/gitops/helm/capgo-console/templates/certificate.yaml
{{- if .Values.ingress.enabled -}}
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: capgo-console-cert
  namespace: {{ .Values.namespace }}
spec:
  secretName: {{ .Values.ingress.tlsSecretName }}
  duration: 2160h
  renewBefore: 360h
  isCA: false
  privateKey:
    algorithm: RSA
    encoding: PKCS1
    size: 2048
  usages:
    - server auth
    - client auth
  dnsNames:
    - {{ .Values.ingress.host }}
  issuerRef:
    name: letsencrypt-production
    kind: ClusterIssuer
    group: cert-manager.io
{{- end }}
```

- [ ] **Step 9: Create registry-secret.yaml**

```yaml
# refs/gitops/helm/capgo-console/templates/registry-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-secret
  namespace: {{ .Values.namespace }}
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: {{ template "capgo-console.dockerconfigjson" . }}
```

- [ ] **Step 10: Verify templates render**

```bash
cd refs/gitops/helm/capgo-console
helm template test . --debug 2>&1 | head -100
```

Expected: All 7 resources render without errors.

- [ ] **Step 11: Commit**

```bash
cd refs/gitops
git add helm/capgo-console/
git commit -m "feat: add Helm chart for Capgo web console"
```

---

## Task 6: ArgoCD Application for Capgo Console

**Files:**
- Create: `refs/gitops/apps/capgo-console/application.yaml`

- [ ] **Step 1: Create ArgoCD Application manifest**

```yaml
# refs/gitops/apps/capgo-console/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: capgo-console
  namespace: argocd
spec:
  destination:
    name: ''
    namespace: capgo-console
    server: 'https://kubernetes.default.svc'
  source:
    path: helm/capgo-console
    repoURL: 'git@github.com:hamza-sahin/gitops.git'
    targetRevision: main
    helm:
      valueFiles:
        - values.yaml
  sources: []
  project: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

- [ ] **Step 2: Commit**

```bash
cd refs/gitops
git add apps/capgo-console/
git commit -m "feat: add ArgoCD Application for Capgo console"
```

---

## Task 7: Deploy Supabase and Verify

This task requires access to the K8s cluster. Push the GitOps changes and let ArgoCD sync.

**Files:** None (operational steps)

- [ ] **Step 1: Push GitOps changes to remote**

```bash
cd refs/gitops
git push origin main
```

ArgoCD will detect the new applications and begin syncing.

- [ ] **Step 2: Monitor Supabase deployment**

```bash
# Watch ArgoCD sync status
kubectl get application supabase -n argocd -o jsonpath='{.status.sync.status}'
# Expected: Synced

# Watch pods come up
kubectl get pods -n supabase -w
# Expected: All pods reach Running status (may take 2-5 minutes)
```

- [ ] **Step 3: Verify Supabase Studio**

Open `https://supabase.optalgo.com` in browser. Log in with the dashboard username/password from `values.yaml`. Expected: Supabase Studio dashboard loads.

- [ ] **Step 4: Verify MinIO**

Open `https://minio-console.optalgo.com` in browser. Log in with MinIO root credentials from `values.yaml`. Expected: MinIO console loads. Create the `capgo` bucket if it doesn't exist automatically.

- [ ] **Step 5: Verify MinIO API**

```bash
curl -s -o /dev/null -w "%{http_code}" https://minio.optalgo.com/minio/health/live
# Expected: 200
```

---

## Task 8: Apply Capgo Database Migrations

Apply Capgo's database schema to the self-hosted Supabase instance.

**Files:** None (operational — uses existing migration files from `refs/capgo/supabase/migrations/`)

- [ ] **Step 1: Link Supabase CLI to self-hosted instance**

```bash
cd refs/capgo
# Set environment to point at self-hosted Supabase
export SUPABASE_URL=https://supabase.optalgo.com
export SUPABASE_DB_URL=postgresql://postgres:<db_password>@supabase.optalgo.com:5432/postgres
```

- [ ] **Step 2: Apply migrations**

```bash
cd refs/capgo
supabase db push --db-url "$SUPABASE_DB_URL"
```

Expected: All 218 migration files applied successfully. If any fail due to missing extensions, enable them first:

```sql
-- Connect to the database and enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS http SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgmq SCHEMA pgmq;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements SCHEMA extensions;
```

- [ ] **Step 3: Verify tables exist**

Connect to the database via Supabase Studio SQL Editor or psql:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected: Tables including `apps`, `app_versions`, `channels`, `devices`, `device_version`, `app_stats`, etc.

---

## Task 9: Deploy Capgo Edge Functions

Deploy Capgo's backend functions to the self-hosted Supabase Edge Runtime.

**Files:** None (operational — uses existing functions from `refs/capgo/supabase/functions/`)

- [ ] **Step 1: Set function environment variables**

In Supabase Studio, go to Edge Functions → Settings, or set via CLI:

```bash
cd refs/capgo
cat > supabase/functions/.env.self-hosted <<'EOF'
S3_ENDPOINT=http://supabase-supabase-minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=capgo-minio-admin
S3_SECRET_ACCESS_KEY=<minio_access_key_from_values>
S3_BUCKET=capgo
S3_SSL=false
API_SECRET=<generate_with_openssl_rand_hex_32>
WEBAPP_URL=https://capgo.optalgo.com
EOF
```

- [ ] **Step 2: Deploy all functions**

```bash
cd refs/capgo

# Deploy each function group
supabase functions deploy updates --project-ref self-hosted
supabase functions deploy stats --project-ref self-hosted
supabase functions deploy channel_self --project-ref self-hosted
supabase functions deploy app --project-ref self-hosted
supabase functions deploy bundle --project-ref self-hosted
supabase functions deploy channel --project-ref self-hosted
supabase functions deploy device --project-ref self-hosted
supabase functions deploy build --project-ref self-hosted
supabase functions deploy organization --project-ref self-hosted
supabase functions deploy webhooks --project-ref self-hosted
supabase functions deploy triggers --project-ref self-hosted
supabase functions deploy private --project-ref self-hosted
```

Note: The exact deployment method depends on how the self-hosted Edge Runtime is configured. If the Supabase CLI doesn't support `--project-ref self-hosted`, you may need to set `SUPABASE_URL` and deploy via `supabase functions deploy --url $SUPABASE_URL`.

- [ ] **Step 3: Verify functions are accessible**

```bash
curl -s -w "\n%{http_code}" https://supabase.optalgo.com/functions/v1/updates
# Expected: 401 or 400 (unauthorized but reachable — means the function is deployed)
```

---

## Task 10: Verify Capgo Console Deployment

**Files:** None (verification only)

- [ ] **Step 1: Check ArgoCD sync**

```bash
kubectl get application capgo-console -n argocd -o jsonpath='{.status.sync.status}'
# Expected: Synced

kubectl get pods -n capgo-console
# Expected: capgo-console pod in Running state
```

- [ ] **Step 2: Open Capgo console**

Open `https://capgo.optalgo.com` in browser. Expected: Capgo login page loads.

- [ ] **Step 3: Create an account and register the app**

Sign up in the Capgo console. Create a new app with bundle ID `com.pawbalance.app`. This generates the API key needed for CLI uploads.

Record the **CAPGO_APIKEY** from the console.

---

## Task 11: Integrate Capgo SDK into PawBalance

**Files:**
- Modify: `capacitor.config.ts`
- Modify: `src/lib/platform.ts`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install the Capgo updater plugin**

```bash
npm install @capgo/capacitor-updater
```

- [ ] **Step 2: Update capacitor.config.ts**

Add the `CapacitorUpdater` plugin configuration. Open `capacitor.config.ts` and add to the `plugins` section:

```typescript
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pawbalance.app",
  appName: "PawBalance",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    CapacitorUpdater: {
      autoUpdate: true,
      statsUrl: "https://supabase.optalgo.com/functions/v1/stats",
      channelUrl: "https://supabase.optalgo.com/functions/v1/channel_self",
      updateUrl: "https://supabase.optalgo.com/functions/v1/updates",
    },
  },
};

export default config;
```

- [ ] **Step 3: Add OTA update listener in platform.ts**

Read `src/lib/platform.ts` first. Then add the Capgo update listener behind the `isNative` check:

```typescript
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export async function initOtaUpdates() {
  if (!isNative) return;

  CapacitorUpdater.notifyAppReady();

  CapacitorUpdater.addListener('updateAvailable', async (update) => {
    try {
      const bundle = await CapacitorUpdater.download({
        url: update.bundle.url,
        version: update.bundle.version,
      });
      await CapacitorUpdater.set(bundle);
    } catch (e) {
      console.error('OTA update failed:', e);
    }
  });
}
```

- [ ] **Step 4: Call initOtaUpdates on app start**

In the root layout or providers component, call `initOtaUpdates()` on mount. The exact location depends on where `isNative` platform init happens — likely `src/app/providers.tsx` or `src/app/layout.tsx`.

```typescript
import { initOtaUpdates } from '@/lib/platform';

// Inside useEffect or equivalent:
initOtaUpdates();
```

- [ ] **Step 5: Sync with iOS**

```bash
npx cap sync ios
```

- [ ] **Step 6: Commit**

```bash
git add capacitor.config.ts src/lib/platform.ts package.json package-lock.json
git commit -m "feat: integrate Capgo OTA updater for live updates"
```

---

## Task 12: GitHub Actions CI/CD Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [master]

env:
  NODE_VERSION: '20'

jobs:
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
        run: npx @capgo/cli bundle upload --channel production
        env:
          CAPGO_APIKEY: ${{ secrets.CAPGO_APIKEY }}
          CAPGO_URL: ${{ secrets.CAPGO_URL }}

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
          xcrun altool --upload-app \
            --type ios \
            --file ios/App/build/*.ipa \
            --apiKey "$APP_STORE_CONNECT_KEY_ID" \
            --apiIssuer "$APP_STORE_CONNECT_ISSUER_ID"
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add CI/CD workflow for OTA deploy and conditional TestFlight"
```

---

## Task 13: Configure GitHub Secrets

**Files:** None (GitHub settings)

- [ ] **Step 1: Add Capgo secrets**

```bash
# Capgo API key from Task 10 Step 3
gh secret set CAPGO_APIKEY --body "<your_capgo_api_key>"

# Self-hosted Supabase functions URL
gh secret set CAPGO_URL --body "https://supabase.optalgo.com/functions/v1"
```

- [ ] **Step 2: Add iOS signing secrets**

```bash
# Export distribution certificate from Keychain Access as .p12
base64 -i /path/to/certificate.p12 | gh secret set CERTIFICATE_P12

# Certificate password
gh secret set CERTIFICATE_PASSWORD --body "<password>"

# Download provisioning profile from Apple Developer
base64 -i /path/to/profile.mobileprovision | gh secret set PROVISIONING_PROFILE

# App Store Connect API key
base64 -i ~/Documents/AuthKey_4NH42JUWM6.p8 | gh secret set APP_STORE_CONNECT_P8
```

- [ ] **Step 3: Verify secrets are set**

```bash
gh secret list
```

Expected: `CAPGO_APIKEY`, `CAPGO_URL`, `CERTIFICATE_P12`, `CERTIFICATE_PASSWORD`, `PROVISIONING_PROFILE`, `APP_STORE_CONNECT_P8` all listed.

---

## Task 14: End-to-End Test

**Files:** None (verification only)

- [ ] **Step 1: Upload first bundle via CLI**

```bash
npm run build
npx @capgo/cli bundle upload \
  --channel production \
  --apikey "<capgo_api_key>" \
  --url "https://supabase.optalgo.com/functions/v1"
```

Expected: Bundle uploaded successfully, version registered.

- [ ] **Step 2: Verify in Capgo console**

Open `https://capgo.optalgo.com`. Navigate to the PawBalance app. Expected: The uploaded bundle appears in the bundles list.

- [ ] **Step 3: Test OTA update on iOS simulator**

```bash
npx cap sync ios
npx cap open ios
```

Build and run in Xcode on a simulator. The app should:
1. Launch normally
2. Call `notifyAppReady()`
3. Check for updates at `supabase.optalgo.com/functions/v1/updates`
4. No update available (first run matches current bundle)

- [ ] **Step 4: Make a test change and upload a new bundle**

Make a small visible change (e.g., add a test string to a component). Then:

```bash
npm run build
npx @capgo/cli bundle upload \
  --channel production \
  --apikey "<capgo_api_key>" \
  --url "https://supabase.optalgo.com/functions/v1"
```

- [ ] **Step 5: Verify OTA update applies**

Relaunch the app in the simulator. Expected: The app downloads the new bundle and applies it. On the next launch, the test change is visible.

- [ ] **Step 6: Test CI/CD pipeline**

Make a small web-only change, commit, and push to master:

```bash
git add -A && git commit -m "test: verify OTA CI/CD pipeline"
git push origin master
```

Check GitHub Actions. Expected: `build` and `deploy-ota` jobs succeed. `deploy-testflight` is skipped (no native changes).

- [ ] **Step 7: Revert test change**

```bash
git revert HEAD
git push origin master
```
