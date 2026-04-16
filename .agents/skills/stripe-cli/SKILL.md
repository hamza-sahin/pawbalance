---
name: stripe-cli
description: Manage Stripe resources, webhooks, and payments using the Stripe CLI. Covers installation, authentication, API operations, webhook listening, testing, and subscription management.
trigger: when user asks to interact with Stripe API, manage payments, subscriptions, webhooks, test Stripe integration, or use stripe CLI commands
negative-trigger: do not use for RevenueCat-only operations, non-Stripe payment providers, or general HTTP API calls unrelated to Stripe
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Agent
---

# Stripe CLI Skill

Manage Stripe resources, forward webhooks, trigger test events, and automate payment workflows using the Stripe CLI.

## Step 1: Ensure Stripe CLI is Installed

Check if `stripe` is available. If not, download it from GitHub releases.

```bash
if ! command -v stripe &>/dev/null; then
  echo "Stripe CLI not found. Installing..."
  VERSION=$(curl -s https://api.github.com/repos/stripe/stripe-cli/releases/latest | grep '"tag_name"' | sed 's/.*"v\(.*\)".*/\1/')
  ARCH=$(uname -m)
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')

  if [ "$OS" = "darwin" ]; then
    OS_LABEL="mac-os"
  else
    OS_LABEL="linux"
  fi

  if [ "$ARCH" = "x86_64" ]; then
    ARCH_LABEL="x86_64"
  elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    ARCH_LABEL="arm64"
  fi

  URL="https://github.com/stripe/stripe-cli/releases/download/v${VERSION}/stripe_${VERSION}_${OS_LABEL}_${ARCH_LABEL}.tar.gz"
  echo "Downloading from: $URL"
  curl -sL "$URL" -o /tmp/stripe-cli.tar.gz
  tar -xzf /tmp/stripe-cli.tar.gz -C /tmp stripe
  sudo mv /tmp/stripe stripe 2>/dev/null || mv /tmp/stripe /usr/local/bin/stripe
  rm /tmp/stripe-cli.tar.gz
  echo "Stripe CLI v${VERSION} installed."
else
  echo "Stripe CLI already installed: $(stripe version)"
fi
```

If `sudo` is unavailable, place the binary in the project's `bin/` directory and use `./bin/stripe` for all subsequent commands.

## Step 2: Authenticate

Check authentication status before any operation:

```bash
stripe whoami 2>/dev/null
```

If not authenticated:
- **Interactive (default):** `stripe login` — opens browser for OAuth
- **API key (non-interactive):** `stripe login --api-key sk_test_...` or set `STRIPE_API_KEY` env var
- **Check project/profile:** `stripe config --list` to see active profile

> Always use **test mode** keys (`sk_test_*`) during development. Only use `--live` flag when explicitly requested.

## Step 3: Execute the Requested Operation

Read `references/commands.md` for the full command reference before executing commands.

### Common Workflows

#### Webhook Forwarding (Development)
```bash
# Forward all events to local endpoint
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Forward specific events only
stripe listen --events checkout.session.completed,customer.subscription.updated \
  --forward-to http://localhost:3000/api/webhooks/stripe

# Print the webhook signing secret
stripe listen --print-secret
```

#### Trigger Test Events
```bash
# Trigger a specific event
stripe trigger checkout.session.completed

# Trigger with overrides
stripe trigger payment_intent.succeeded --override payment_intent:amount=2000

# List available trigger events
stripe trigger --help
```

#### Resource CRUD
```bash
# Create a resource
stripe customers create -d email="user@example.com" -d name="Test User"

# Retrieve by ID
stripe customers retrieve cus_xxx

# List with pagination
stripe customers list --limit 10

# Update
stripe customers update cus_xxx -d name="Updated Name"

# Delete
stripe customers delete cus_xxx
```

#### Subscription Management
```bash
# Create a product + price
stripe products create -d name="Premium Plan"
stripe prices create -d product=prod_xxx -d unit_amount=999 -d currency=usd \
  -d "recurring[interval]=month"

# Create a subscription
stripe subscriptions create -d customer=cus_xxx -d "items[0][price]"=price_xxx

# Cancel
stripe subscriptions cancel sub_xxx
```

#### Inspect Logs
```bash
# Tail API request logs
stripe logs tail

# Filter by status
stripe logs tail --filter-status-code-type 4XX

# Filter by path
stripe logs tail --filter-request-path /v1/charges
```

## Step 4: Verify Results

After any mutating operation:
1. Confirm the response shows expected data
2. For webhook forwarding, verify the local endpoint received events
3. Use `stripe get /v1/<resource>/<id>` to double-check resource state

## Error Handling

| Error | Resolution |
|-------|-----------|
| `Your API key has expired` | Re-authenticate: `stripe login` |
| `No such customer/product/...` | Verify the resource ID and that you're in the correct mode (test vs live) |
| `webhook signing secret mismatch` | Use the secret from `stripe listen --print-secret` in your app |
| `rate limit exceeded` | Wait and retry; reduce request frequency |

## Safety Rules

- **Never use `--live` unless the user explicitly requests it.** Default to test mode.
- **Never expose API keys** in logs, files, or output. Use env vars or `stripe login`.
- **Always confirm before destructive operations** like deleting customers, canceling subscriptions, or modifying live resources.
- **Webhook secrets are ephemeral** — a new `stripe listen` session generates a new signing secret. Ensure the app uses the current one.
