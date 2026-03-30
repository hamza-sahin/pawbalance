# PawBalance GitOps & CI/CD Design

## Overview

Set up a GitOps repository (`github.com/hamza-sahin/gitops.git`) for deploying PawBalance to the existing k3s cluster via ArgoCD, plus GitHub Actions CI/CD to build, push, and deploy automatically on merge to `main`. Mirrors the exact patterns used in the `freedx-manifests` bare-metal deployment.

## Deliverables

Two repos are affected:

1. **gitops repo** (`github.com/hamza-sahin/gitops.git`) — Helm chart + ArgoCD Application manifest
2. **pawbalance web repo** — Dockerfile, nginx.conf, GitHub Actions workflow

## GitOps Repository Structure

```
gitops/
├── apps/
│   └── pawbalance/
│       └── application.yaml           # ArgoCD Application
└── helm/
    └── pawbalance/
        ├── Chart.yaml
        ├── values.yaml
        └── templates/
            ├── _helpers.tpl           # dockerconfigjson helper
            ├── namespace.yaml
            ├── deployment.yaml
            ├── service.yaml
            ├── ingressroute.yaml      # Traefik IngressRoute
            ├── certificate.yaml       # cert-manager TLS Certificate
            └── registry-secret.yaml   # imagePullSecret for registry.optalgo.com
```

## ArgoCD Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: pawbalance
  namespace: argocd
spec:
  destination:
    namespace: pawbalance
    server: 'https://kubernetes.default.svc'
  source:
    path: helm/pawbalance
    repoURL: 'git@github.com:hamza-sahin/gitops.git'
    targetRevision: main
    helm:
      valueFiles:
        - values.yaml
  project: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

- Points to `main` branch (dedicated repo, unlike freedx which uses `bare-metal` branch in a shared repo)
- Auto-sync with prune and self-heal, matching freedx pattern
- Deploys to `pawbalance` namespace

## Helm Chart

### Chart.yaml

```yaml
apiVersion: v2
name: pawbalance
description: A Helm chart for PawBalance web app
type: application
version: 0.1.0
appVersion: "1.0.0"
```

### values.yaml

```yaml
namespace: pawbalance

replicaCount: 1

image:
  repository: registry.optalgo.com/pawbalance-web
  tag: latest

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  host: pawbalance.optalgo.com
  entryPoints:
    - websecure
  tlsSecretName: pawbalance-tls-secret

imageRegistry:
  server: registry.optalgo.com
  username: admin
  password: kC7qGuJcLoADMEHYhN/T
```

No runtime secrets needed. PawBalance is a static site — `NEXT_PUBLIC_*` Supabase vars are baked at build time.

### Templates

All templates follow the exact freedx bare-metal patterns:

**`_helpers.tpl`** — identical to freedx, generates base64-encoded `.dockerconfigjson` from `imageRegistry` values.

**`namespace.yaml`** — creates `pawbalance` namespace.

**`registry-secret.yaml`** — Kubernetes `dockerconfigjson` Secret named `registry-secret`, identical pattern to freedx.

**`deployment.yaml`** — mirrors freedx `docs` subchart deployment:
- Single container serving on port 80
- `imagePullSecrets` referencing `registry-secret`
- Image from `registry.optalgo.com/pawbalance-web:<tag>`

**`service.yaml`** — ClusterIP on port 80, same as freedx services.

**`ingressroute.yaml`** — Traefik IngressRoute:
- Host: `pawbalance.optalgo.com`
- EntryPoints: `websecure`
- TLS via cert-manager secret

**`certificate.yaml`** — cert-manager Certificate:
- Uses existing `letsencrypt-production` ClusterIssuer
- Generates TLS secret `pawbalance-tls-secret`

## GitHub Actions Workflow

Single workflow in the PawBalance web repo at `.github/workflows/deploy.yaml`:

```
Trigger: push to main

Job 1 — Build & Push:
  1. Checkout web repo
  2. Login to registry.optalgo.com (REGISTRY_USERNAME, REGISTRY_PASSWORD secrets)
  3. Build Docker image (multi-stage: npm build → nginx)
     - Pass SUPABASE_URL and SUPABASE_ANON_KEY as build args
  4. Tag: latest + ${{ github.run_number }}
  5. Push to registry.optalgo.com/pawbalance-web

Job 2 — Update GitOps (depends on Job 1):
  1. Checkout github.com/hamza-sahin/gitops.git (main branch)
  2. sed to update image tag in helm/pawbalance/values.yaml
  3. git commit "Updated pawbalance-web image tag to <run_number>"
  4. git push with retry logic (up to 5 attempts with rebase, matching freedx pattern)
```

### GitHub Actions Secrets (on web repo)

| Secret | Purpose |
|---|---|
| `REGISTRY_USERNAME` | Docker registry username (`admin`) |
| `REGISTRY_PASSWORD` | Docker registry password |
| `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` for build-time injection |
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` for build-time injection |
| `GH_PAT` | Personal Access Token with `repo` scope, used to push to the gitops repo |

`GITHUB_TOKEN` is scoped to the workflow's own repo and cannot push to `hamza-sahin/gitops`. A PAT (`GH_PAT`) with `repo` scope is required instead.

## Dockerfile

Multi-stage build in the PawBalance web repo root:

```dockerfile
# Stage 1: Build static export
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## nginx.conf

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }
}
```

`$uri.html` handles Next.js static export routes (e.g., `/search` → `search.html`).

## ArgoCD Repository Access

The gitops repo is private. ArgoCD needs a deploy key to poll it:

1. Generate SSH key pair
2. Add public key as a deploy key on `github.com/hamza-sahin/gitops` via `gh repo deploy-key add`
3. Create ArgoCD repo secret in the cluster (same pattern as `argocdrepo.yaml` in freedx manual-resources)

## Deployment Flow

```
Developer pushes to main (web repo)
  → GitHub Actions builds Docker image
  → Pushes to registry.optalgo.com/pawbalance-web:<run_number>
  → Updates helm/pawbalance/values.yaml tag in gitops repo
  → ArgoCD detects git change (auto-sync)
  → Helm re-renders with new image tag
  → Kubernetes rolls out new deployment
  → PawBalance live at pawbalance.optalgo.com
```

## Manual Setup Steps (not automated)

1. Add GitHub Actions secrets to the web repo (`REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GH_PAT`)
2. Generate and configure ArgoCD deploy key for the gitops repo
3. Apply the ArgoCD Application manifest to the cluster (`kubectl apply -f apps/pawbalance/application.yaml`)
4. Configure DNS: point `pawbalance.optalgo.com` to the k3s cluster's external IP
