# Stripe CLI Command Reference

## Global Flags (available on all commands)

| Flag | Short | Description |
|------|-------|-------------|
| `--api-key` | | Stripe API key to use |
| `--color` | | Color output: `on`, `off`, `auto` |
| `--config` | | Path to config file |
| `--device-name` | | Device name for this machine |
| `--log-level` | | Log level: `debug`, `info`, `trace`, `warn`, `error` |
| `--project-name` | `-p` | Project name (default: `default`) |

## Authentication

### `stripe login`
Authenticate with Stripe. Opens browser by default.

| Flag | Short | Description |
|------|-------|-------------|
| `--interactive` | `-i` | Use interactive terminal login |
| `--api-key` | | Login with an API key directly |

**Subcommands:**
- `stripe login list` — List all authenticated accounts
- `stripe login switch` — Switch between accounts

### `stripe logout`
End current session.

### `stripe whoami`
Show current auth state (account, mode, key expiry).

| Flag | Description |
|------|-------------|
| `--format json` | Machine-readable output |

## Configuration

### `stripe config`
View or modify CLI configuration.

| Flag | Short | Description |
|------|-------|-------------|
| `--list` | | Show all config values |
| `--edit` | `-e` | Open config in editor |
| `--set` | | Set a config value: `--set key=value` |
| `--unset` | | Remove a config value |

Config file location: `~/.config/stripe/config.toml`

## HTTP Request Commands

All share these flags:

| Flag | Short | Description |
|------|-------|-------------|
| `--data` | `-d` | Request data (repeatable) |
| `--expand` | `-e` | Expand nested objects (repeatable) |
| `--idempotency` | `-i` | Idempotency key |
| `--stripe-version` | `-v` | API version override |
| `--stripe-account` | | Connected account header |
| `--show-headers` | `-s` | Show response headers |
| `--live` | | Use live mode (default: test) |
| `--confirm` | `-c` | Skip confirmation prompts |
| `--dry-run` | | Preview without sending |

### `stripe get <path>`
Make GET requests. Additional flags:

| Flag | Short | Description |
|------|-------|-------------|
| `--limit` | `-l` | Number of objects (1-100, default 10) |
| `--starting-after` | `-a` | Pagination cursor (forward) |
| `--ending-before` | `-b` | Pagination cursor (backward) |

### `stripe post <path>`
Make POST requests.

### `stripe delete <path>`
Make DELETE requests.

**Examples:**
```bash
stripe get /v1/customers --limit 5
stripe post /v1/customers -d email=test@test.com -d name="Test"
stripe delete /v1/customers/cus_xxx
```

## Resource Commands

Auto-generated from Stripe's OpenAPI spec. Pattern: `stripe <resource> <operation> [flags]`

### Key Resources

| Resource | Operations |
|----------|-----------|
| `customers` | `create`, `retrieve`, `list`, `update`, `delete` |
| `charges` | `create`, `retrieve`, `list`, `update`, `capture` |
| `payment_intents` | `create`, `retrieve`, `list`, `update`, `confirm`, `cancel`, `capture` |
| `setup_intents` | `create`, `retrieve`, `list`, `update`, `confirm`, `cancel` |
| `products` | `create`, `retrieve`, `list`, `update`, `delete` |
| `prices` | `create`, `retrieve`, `list`, `update` |
| `subscriptions` | `create`, `retrieve`, `list`, `update`, `cancel` |
| `invoices` | `create`, `retrieve`, `list`, `update`, `delete`, `finalize`, `pay`, `void` |
| `payment_methods` | `create`, `retrieve`, `list`, `update`, `attach`, `detach` |
| `checkout.sessions` | `create`, `retrieve`, `list` |
| `events` | `retrieve`, `list`, `resend` |
| `refunds` | `create`, `retrieve`, `list`, `update` |
| `coupons` | `create`, `retrieve`, `list`, `update`, `delete` |
| `promotion_codes` | `create`, `retrieve`, `list`, `update` |

### Namespaced Resources

| Namespace | Resources |
|-----------|-----------|
| `billing` | `meters`, `meter_events`, `credit_grants` |
| `issuing` | `cards`, `cardholders`, `transactions`, `authorizations` |
| `terminal` | `readers`, `locations`, `configurations` |
| `identity` | `verification_sessions`, `verification_reports` |
| `radar` | `value_lists`, `value_list_items` |
| `financial_connections` | `accounts`, `sessions` |

**Examples:**
```bash
stripe products create -d name="Pro Plan" -d description="Monthly pro"
stripe prices create -d product=prod_xxx -d unit_amount=1999 -d currency=usd -d "recurring[interval]=month"
stripe subscriptions create -d customer=cus_xxx -d "items[0][price]"=price_xxx
stripe billing meters list
stripe payment_intents confirm pi_xxx
```

## Webhooks

### `stripe listen`
Listen for and forward webhook events.

| Flag | Short | Description |
|------|-------|-------------|
| `--forward-to` | `-f` | URL to forward events to |
| `--events` | `-e` | Comma-separated event types to filter |
| `--forward-connect-to` | `-c` | Forward Connect events to this URL |
| `--headers` | `-H` | Custom headers for forwarded requests |
| `--latest` | `-l` | Receive only latest event version |
| `--live` | | Listen in live mode |
| `--format` | | Output format (`json` for machine-readable) |
| `--use-configured-webhooks` | `-a` | Use configured webhook endpoints |
| `--skip-verify` | | Skip TLS certificate verification |
| `--print-secret` | | Print webhook signing secret and exit |
| `--thin-events` | | Receive thin event objects (v2) |
| `--forward-thin-to` | | Forward thin events to this URL |

**Key events for subscription apps:**
```
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.trial_will_end
invoice.paid
invoice.payment_failed
invoice.payment_action_required
payment_intent.succeeded
payment_intent.payment_failed
```

### `stripe trigger <event>`
Trigger a test webhook event.

| Flag | Description |
|------|-------------|
| `--stripe-account` | Connected account |
| `--override` | Override fixture values (e.g., `payment_intent:amount=5000`) |
| `--add` | Add fixture values |
| `--remove` | Remove fixture values |
| `--skip` | Skip fixture steps |
| `--raw` | Send raw event data |
| `--edit` | Edit fixture before running |

## Logs

### `stripe logs tail`
Tail API request logs in real time.

| Flag | Description |
|------|-------------|
| `--format` | Output format |
| `--filter-account` | Filter by account |
| `--filter-http-methods` | Filter by method (GET, POST, DELETE) |
| `--filter-request-path` | Filter by API path |
| `--filter-status-code-type` | Filter by status: `2XX`, `4XX`, `5XX` |

## Test Data

### `stripe fixtures <file>`
Run fixture files to populate test data.

| Flag | Description |
|------|-------------|
| `--stripe-account` | Connected account |
| `--override` | Override fixture values |
| `--add` | Add fixture data |
| `--remove` | Remove fixture data |
| `--edit` | Edit fixture before running |

## Utility Commands

| Command | Description |
|---------|-------------|
| `stripe open <shortcut>` | Open Stripe Dashboard pages in browser |
| `stripe samples create <name>` | Create a sample integration |
| `stripe samples list` | List available samples |
| `stripe completion --shell bash\|zsh` | Generate shell completions |
| `stripe serve --port 4242` | Serve static files locally |
| `stripe community` | Open community links |
| `stripe version` | Show CLI version |

### Dashboard Shortcuts for `stripe open`

`dashboard`, `dashboard/apikeys`, `dashboard/payments`, `dashboard/customers`,
`dashboard/subscriptions`, `dashboard/invoices`, `dashboard/billing`,
`dashboard/connect`, `dashboard/events`, `dashboard/logs`, `dashboard/balance`,
`dashboard/disputes`, `api`, `apiref`, `cliref`
