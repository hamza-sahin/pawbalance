# PawBalance GitOps & CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy PawBalance to an existing k3s cluster via ArgoCD GitOps, with GitHub Actions CI/CD for automated build-and-deploy on push to main.

**Architecture:** A dedicated gitops repo (`github.com/hamza-sahin/gitops.git`) holds a Helm chart and ArgoCD Application manifest, mirroring the freedx-manifests bare-metal patterns. The PawBalance web repo gets a Dockerfile, nginx config, and a GitHub Actions workflow that builds/pushes Docker images and updates the gitops repo's image tag.

**Tech Stack:** Helm, ArgoCD, Traefik, cert-manager, GitHub Actions, Docker, nginx, k3s

---

## File Map

### gitops repo (`refs/gitops/`)

| File | Purpose |
|---|---|
| `apps/pawbalance/application.yaml` | ArgoCD Application manifest |
| `helm/pawbalance/Chart.yaml` | Helm chart metadata |
| `helm/pawbalance/values.yaml` | Deployment configuration (image, ingress, registry creds) |
| `helm/pawbalance/templates/_helpers.tpl` | Docker registry auth JSON helper |
| `helm/pawbalance/templates/namespace.yaml` | Creates `pawbalance` namespace |
| `helm/pawbalance/templates/registry-secret.yaml` | imagePullSecret for registry.optalgo.com |
| `helm/pawbalance/templates/deployment.yaml` | Deployment resource |
| `helm/pawbalance/templates/service.yaml` | ClusterIP Service |
| `helm/pawbalance/templates/certificate.yaml` | cert-manager TLS Certificate |
| `helm/pawbalance/templates/ingressroute.yaml` | Traefik IngressRoute |

### pawbalance web repo (`/Users/hamzasahin/src/petpal/web/`)

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build: npm build -> nginx static serve |
| `nginx.conf` | nginx config for SPA routing |
| `.github/workflows/deploy.yaml` | CI/CD: build image, push, update gitops repo |

---

## Task 1: Helm Chart Skeleton (gitops repo)

**Files:**
- Create: `refs/gitops/helm/pawbalance/Chart.yaml`
- Create: `refs/gitops/helm/pawbalance/values.yaml`

- [ ] **Step 1: Create Chart.yaml**

```yaml
apiVersion: v2
name: pawbalance
description: A Helm chart for PawBalance web app
type: application
version: 0.1.0
appVersion: "1.0.0"
```

Write this to `refs/gitops/helm/pawbalance/Chart.yaml`.

- [ ] **Step 2: Create values.yaml**

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

Write this to `refs/gitops/helm/pawbalance/values.yaml`.

- [ ] **Step 3: Commit**

```bash
cd refs/gitops
git add helm/pawbalance/Chart.yaml helm/pawbalance/values.yaml
git commit -m "feat: add pawbalance Helm chart skeleton with values"
```

---

## Task 2: Helm Templates — Namespace, Registry Secret, Helpers (gitops repo)

**Files:**
- Create: `refs/gitops/helm/pawbalance/templates/_helpers.tpl`
- Create: `refs/gitops/helm/pawbalance/templates/namespace.yaml`
- Create: `refs/gitops/helm/pawbalance/templates/registry-secret.yaml`

- [ ] **Step 1: Create _helpers.tpl**

This is identical to the freedx pattern. It generates a base64-encoded `.dockerconfigjson` from the `imageRegistry` values.

```gotemplate
{{- define "pawbalance.dockerconfigjson" -}}
{{- $server := .Values.imageRegistry.server -}}
{{- $username := .Values.imageRegistry.username -}}
{{- $password := .Values.imageRegistry.password -}}
{{- $auth := printf "%s:%s" $username $password | b64enc -}}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"auth\":\"%s\"}}}" $server $username $password $auth | b64enc -}}
{{- end -}}
```

Write this to `refs/gitops/helm/pawbalance/templates/_helpers.tpl`.

- [ ] **Step 2: Create namespace.yaml**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .Values.namespace }}
  labels:
    name: {{ .Values.namespace }}
```

Write this to `refs/gitops/helm/pawbalance/templates/namespace.yaml`.

- [ ] **Step 3: Create registry-secret.yaml**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-secret
  namespace: {{ .Values.namespace }}
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: {{ template "pawbalance.dockerconfigjson" . }}
```

Write this to `refs/gitops/helm/pawbalance/templates/registry-secret.yaml`.

- [ ] **Step 4: Commit**

```bash
cd refs/gitops
git add helm/pawbalance/templates/_helpers.tpl helm/pawbalance/templates/namespace.yaml helm/pawbalance/templates/registry-secret.yaml
git commit -m "feat: add namespace, registry secret, and helpers templates"
```

---

## Task 3: Helm Templates — Deployment and Service (gitops repo)

**Files:**
- Create: `refs/gitops/helm/pawbalance/templates/deployment.yaml`
- Create: `refs/gitops/helm/pawbalance/templates/service.yaml`

- [ ] **Step 1: Create deployment.yaml**

Mirrors the freedx `docs` subchart deployment pattern.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pawbalance-web
  namespace: {{ .Values.namespace }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: pawbalance-web
  template:
    metadata:
      labels:
        app: pawbalance-web
    spec:
      containers:
      - name: pawbalance-web
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: {{ .Values.service.port }}
      imagePullSecrets:
      - name: registry-secret
```

Write this to `refs/gitops/helm/pawbalance/templates/deployment.yaml`.

- [ ] **Step 2: Create service.yaml**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: pawbalance-web
  namespace: {{ .Values.namespace }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.port }}
    protocol: TCP
  selector:
    app: pawbalance-web
```

Write this to `refs/gitops/helm/pawbalance/templates/service.yaml`.

- [ ] **Step 3: Commit**

```bash
cd refs/gitops
git add helm/pawbalance/templates/deployment.yaml helm/pawbalance/templates/service.yaml
git commit -m "feat: add deployment and service templates"
```

---

## Task 4: Helm Templates — Certificate and IngressRoute (gitops repo)

**Files:**
- Create: `refs/gitops/helm/pawbalance/templates/certificate.yaml`
- Create: `refs/gitops/helm/pawbalance/templates/ingressroute.yaml`

- [ ] **Step 1: Create certificate.yaml**

Uses the existing `letsencrypt-production` ClusterIssuer already deployed in the cluster.

```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: pawbalance-cert
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

Write this to `refs/gitops/helm/pawbalance/templates/certificate.yaml`.

- [ ] **Step 2: Create ingressroute.yaml**

Follows the freedx bare-metal Traefik IngressRoute pattern (same API version as `infrastructure/templates/ingress.yaml`).

```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: pawbalance-routes
  namespace: {{ .Values.namespace }}
spec:
  entryPoints:
    {{- toYaml .Values.ingress.entryPoints | nindent 4 }}
  routes:
    - match: Host(`{{ .Values.ingress.host }}`)
      kind: Rule
      services:
        - name: pawbalance-web
          port: {{ .Values.service.port }}
  tls:
    secretName: {{ .Values.ingress.tlsSecretName }}
{{- end }}
```

Write this to `refs/gitops/helm/pawbalance/templates/ingressroute.yaml`.

- [ ] **Step 3: Commit**

```bash
cd refs/gitops
git add helm/pawbalance/templates/certificate.yaml helm/pawbalance/templates/ingressroute.yaml
git commit -m "feat: add TLS certificate and Traefik IngressRoute templates"
```

---

## Task 5: ArgoCD Application Manifest (gitops repo)

**Files:**
- Create: `refs/gitops/apps/pawbalance/application.yaml`

- [ ] **Step 1: Create application.yaml**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: pawbalance
  namespace: argocd
spec:
  destination:
    name: ''
    namespace: pawbalance
    server: 'https://kubernetes.default.svc'
  source:
    path: helm/pawbalance
    repoURL: 'https://github.com/hamza-sahin/gitops.git'
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
```

Write this to `refs/gitops/apps/pawbalance/application.yaml`.

- [ ] **Step 2: Commit**

```bash
cd refs/gitops
git add apps/pawbalance/application.yaml
git commit -m "feat: add ArgoCD Application manifest for pawbalance"
```

---

## Task 6: Dockerfile and nginx.conf (web repo)

**Files:**
- Create: `/Users/hamzasahin/src/petpal/web/Dockerfile`
- Create: `/Users/hamzasahin/src/petpal/web/nginx.conf`

- [ ] **Step 1: Create nginx.conf**

Next.js static export generates `.html` files per route (e.g., `search.html`, `profile.html`). The `$uri.html` directive handles direct navigation to those routes. The fallback to `/index.html` handles client-side routing.

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

Write this to `/Users/hamzasahin/src/petpal/web/nginx.conf`.

- [ ] **Step 2: Create Dockerfile**

Multi-stage build: stage 1 runs `npm run build` to produce static files in `out/`, stage 2 serves them with nginx. The `NEXT_PUBLIC_*` vars must be passed as build args because they're baked into the JS bundle at build time.

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

Write this to `/Users/hamzasahin/src/petpal/web/Dockerfile`.

- [ ] **Step 3: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web
git add Dockerfile nginx.conf
git commit -m "feat: add Dockerfile and nginx config for static serving"
```

---

## Task 7: GitHub Actions Workflow (web repo)

**Files:**
- Create: `/Users/hamzasahin/src/petpal/web/.github/workflows/deploy.yaml`

- [ ] **Step 1: Create deploy.yaml**

This workflow mirrors the freedx Azure DevOps pipeline translated to GitHub Actions. It has two jobs: build-and-push (Docker image to registry.optalgo.com) and update-gitops (sed the image tag in the gitops repo's values.yaml and push).

Required GitHub Actions secrets (must be configured manually on the repo):
- `REGISTRY_USERNAME` — Docker registry username
- `REGISTRY_PASSWORD` — Docker registry password
- `SUPABASE_URL` — `NEXT_PUBLIC_SUPABASE_URL` value
- `SUPABASE_ANON_KEY` — `NEXT_PUBLIC_SUPABASE_ANON_KEY` value
- `GH_PAT` — Personal Access Token with `repo` scope for pushing to the gitops repo

```yaml
name: Build and Deploy

on:
  push:
    branches:
      - main

env:
  IMAGE_REPOSITORY: pawbalance-web
  CONTAINER_REGISTRY: registry.optalgo.com
  GITOPS_REPO: hamza-sahin/gitops

jobs:
  build-and-push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to Docker Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.CONTAINER_REGISTRY }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ env.CONTAINER_REGISTRY }}/${{ env.IMAGE_REPOSITORY }}:latest
            ${{ env.CONTAINER_REGISTRY }}/${{ env.IMAGE_REPOSITORY }}:${{ github.run_number }}
          build-args: |
            NEXT_PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}

  update-gitops:
    name: Update GitOps Repo
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Checkout GitOps Repo
        uses: actions/checkout@v4
        with:
          repository: ${{ env.GITOPS_REPO }}
          token: ${{ secrets.GH_PAT }}
          ref: main

      - name: Update Image Tag
        run: |
          sed -i '/image:/,/tag:/ s/tag: .*/tag: "${{ github.run_number }}"/' helm/pawbalance/values.yaml

      - name: Commit and Push
        run: |
          git config user.email "ci@pawbalance.com"
          git config user.name "PawBalance CI"
          git add helm/pawbalance/values.yaml
          git commit -m "Updated pawbalance-web image tag to ${{ github.run_number }}"
          MAX_RETRIES=5
          RETRY_COUNT=0
          while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            if git push origin main; then
              echo "Successfully pushed changes"
              exit 0
            else
              RETRY_COUNT=$((RETRY_COUNT + 1))
              if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "Push failed, retrying ($RETRY_COUNT/$MAX_RETRIES)"
                git pull --rebase origin main
              fi
            fi
          done
          echo "Failed to push after $MAX_RETRIES attempts"
          exit 1
```

Write this to `/Users/hamzasahin/src/petpal/web/.github/workflows/deploy.yaml`.

- [ ] **Step 2: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web
git add .github/workflows/deploy.yaml
git commit -m "feat: add GitHub Actions workflow for build and deploy"
```

---

## Task 8: ArgoCD Repository Access (gitops repo)

**Files:**
- Create: `refs/gitops/manual-resources/argocd-gitops-repo.yaml`

This task generates an SSH deploy key, registers it with GitHub, and creates the ArgoCD repo secret manifest. This mirrors the `argocdrepo.yaml` pattern from freedx-manifests.

- [ ] **Step 1: Generate SSH deploy key**

```bash
ssh-keygen -t ed25519 -f /tmp/gitops-deploy-key -N "" -C "argocd-gitops"
```

This creates `/tmp/gitops-deploy-key` (private) and `/tmp/gitops-deploy-key.pub` (public).

- [ ] **Step 2: Add deploy key to GitHub repo**

```bash
gh repo deploy-key add /tmp/gitops-deploy-key.pub --repo hamza-sahin/gitops --title "ArgoCD Deploy Key"
```

- [ ] **Step 3: Create ArgoCD repo secret manifest**

Read the private key content and create the manifest. The file follows the same pattern as `freedx-manifests/bare-metal/manual-resources/argocdrepo.yaml`.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gitops-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  url: git@github.com:hamza-sahin/gitops.git
  sshPrivateKey: |
    <PASTE CONTENT OF /tmp/gitops-deploy-key HERE>
  insecure: "true"
  enableLfs: "true"
```

Write this to `refs/gitops/manual-resources/argocd-gitops-repo.yaml`, replacing `<PASTE CONTENT OF /tmp/gitops-deploy-key HERE>` with the actual content of `/tmp/gitops-deploy-key`.

- [ ] **Step 4: Commit**

```bash
cd refs/gitops
git add manual-resources/argocd-gitops-repo.yaml
git commit -m "feat: add ArgoCD repo secret for GitHub gitops access"
```

- [ ] **Step 5: Clean up temp key**

```bash
rm /tmp/gitops-deploy-key /tmp/gitops-deploy-key.pub
```

---

## Task 9: Push gitops repo to GitHub

- [ ] **Step 1: Push all commits**

```bash
cd refs/gitops
git push -u origin main
```

---

## Task 10: Manual Cluster Setup (instructions only — not automated)

These steps must be run manually by the operator against the k3s cluster.

- [ ] **Step 1: Apply ArgoCD repo secret**

```bash
kubectl apply -f manual-resources/argocd-gitops-repo.yaml
```

This tells ArgoCD how to authenticate with the private GitHub gitops repo.

- [ ] **Step 2: Apply ArgoCD Application**

```bash
kubectl apply -f apps/pawbalance/application.yaml
```

ArgoCD will start syncing immediately — it will create the `pawbalance` namespace, registry secret, deployment, service, certificate, and ingress route.

- [ ] **Step 3: Configure DNS**

Add a DNS A record pointing `pawbalance.optalgo.com` to the k3s cluster's external IP address. The cert-manager Certificate will auto-provision a Let's Encrypt TLS cert once DNS resolves.

- [ ] **Step 4: Add GitHub Actions secrets**

Go to `github.com/hamza-sahin/pawbalance` > Settings > Secrets and variables > Actions, and add:

| Secret Name | Value |
|---|---|
| `REGISTRY_USERNAME` | `admin` |
| `REGISTRY_PASSWORD` | `kC7qGuJcLoADMEHYhN/T` |
| `SUPABASE_URL` | Your `NEXT_PUBLIC_SUPABASE_URL` value |
| `SUPABASE_ANON_KEY` | Your `NEXT_PUBLIC_SUPABASE_ANON_KEY` value |
| `GH_PAT` | A Personal Access Token with `repo` scope |

- [ ] **Step 5: Verify end-to-end**

Push a change to `main` on the pawbalance web repo. Watch:
1. GitHub Actions runs the build-and-push job
2. GitHub Actions runs the update-gitops job
3. ArgoCD detects the values.yaml change and syncs
4. `pawbalance.optalgo.com` serves the updated app
