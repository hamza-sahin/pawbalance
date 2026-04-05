# ASC CLI Command Reference

Source: `refs/App-Store-Connect-CLI/docs/COMMANDS.md`

Always verify flags with `asc <command> --help` before running.

## Global Flags

| Flag | Purpose |
|------|---------|
| `--api-debug` | HTTP debug logging to stderr (redacts sensitive values) |
| `--debug` | Debug logging to stderr |
| `--profile NAME` | Use named authentication profile |
| `--report FORMAT` | CI report format (e.g., junit) |
| `--report-file PATH` | Write CI report to file |
| `--retry-log` | Retry logging to stderr |
| `--strict-auth` | Fail on multi-source credentials |
| `--version` | Print version |

## Command Families

### Getting Started
| Command | Description |
|---------|-------------|
| `auth` | Manage authentication (login, logout, switch, status, doctor, token) |
| `doctor` | Diagnose auth configuration issues |
| `init` | Initialize asc helper docs in current repo |
| `docs` | Access embedded documentation |

### Analytics & Finance
| Command | Description |
|---------|-------------|
| `analytics` | Request/download analytics and sales reports |
| `insights` | Generate weekly/daily insights from App Store data |
| `finance` | Download payments and financial reports |
| `performance` | Access performance metrics and diagnostic logs |

### App Management
| Command | Description |
|---------|-------------|
| `apps` | List, get, update apps. Subcommands: list, get, update, info, ci-product, wall, public |
| `app-setup` | Post-create app setup automation |
| `app-tags` | Inspect Apple-generated discoverability tags |
| `versions` | Manage App Store versions (list, create, update, delete, submit, release) |
| `localizations` | Manage localization metadata (list, create, update) |
| `metadata` | Deterministic metadata workflows (apply, pull, diff) |
| `screenshots` | Upload/manage screenshots (list, upload, plan, apply, delete) |
| `video-previews` | Manage app preview videos (list, upload, delete) |
| `background-assets` | Manage background assets |
| `product-pages` | Custom product pages and experiments |
| `routing-coverage` | Routing app coverage files |
| `pricing` | App pricing and availability (list, set, availability) |
| `pre-orders` | App pre-orders |
| `categories` | App Store categories |
| `age-rating` | Age rating declarations |
| `accessibility` | Accessibility declarations |
| `encryption` | Encryption declarations and documents |
| `eula` | End User License Agreements |
| `agreements` | Manage agreements |
| `app-clips` | App Clip experiences and invocations |
| `nominations` | Featuring nominations |
| `game-center` | Game Center resources |

### TestFlight & Builds
| Command | Description |
|---------|-------------|
| `testflight` | Manage TestFlight (list, builds, feedback, crashes, groups, testers, invitations) |
| `builds` | Manage builds (list, upload, get, update, add-groups, remove-groups, expire, next-build-number) |
| `build-bundles` | Build bundles and App Clip data |
| `build-localizations` | Build release notes localizations |
| `xcode` | Local Xcode helpers: archive, export, version-bump (macOS only) |
| `sandbox` | Manage sandbox testers |

### Review & Release
| Command | Description |
|---------|-------------|
| `release` | High-level release workflows (stage, submit, cancel) |
| `status` | Release pipeline dashboard (--app, --watch) |
| `release-notes` | Generate/manage release notes |
| `review` | Review details, attachments, submissions (status, doctor, attachments) |
| `reviews` | Customer reviews |
| `submit` | Submission lifecycle (status, cancel, upload, metadata, review) |
| `validate` | Submission readiness report |
| `publish` | High-level publish: appstore, testflight |

### Monetization
| Command | Description |
|---------|-------------|
| `iap` | In-app purchases (list, create, update, delete, families, pricing-schedules) |
| `subscriptions` | Subscription groups (list, create, update, promotion-codes) |
| `app-events` | In-app events |
| `offer-codes` | Offer codes |
| `win-back-offers` | Win-back offers |

### Signing & Certificates
| Command | Description |
|---------|-------------|
| `signing` | Signing certificates and profiles |
| `bundle-ids` | Bundle IDs and capabilities (list, create, get, update, capabilities) |
| `certificates` | Signing certificates (list, create, revoke) |
| `profiles` | Provisioning profiles (list, create, get, revoke) |
| `merchant-ids` | Merchant IDs and certificates |
| `pass-type-ids` | Pass type IDs |
| `notarization` | macOS notarization submissions |

### Team & Access
| Command | Description |
|---------|-------------|
| `account` | Account-level health and access signals |
| `users` | Users and invitations (list, invite, update, revoke) |
| `actors` | Lookup actors by ID |
| `devices` | Devices (list, create, update, disable) |

### Automation
| Command | Description |
|---------|-------------|
| `workflow` | Multi-step automation (validate, run) via `.asc/workflow.json` |
| `webhooks` | Webhooks (list, create, update, delete) |
| `xcode-cloud` | Xcode Cloud workflows (run, build-runs get, workflows list) |
| `notify` | External service notifications |
| `migrate` | Migrate metadata from/to fastlane format |

### Utility
| Command | Description |
|---------|-------------|
| `diff` | Deterministic non-mutating diff plans |
| `version` | Print version info |
| `completion` | Shell completion scripts |
| `schema` | Inspect API endpoint schemas at runtime |

## High-Signal Examples

```bash
# List apps
asc apps list --output table

# Upload a build
asc builds upload --app "123456789" --ipa "/path/to/MyApp.ipa"

# Stage a version before submission
asc release stage --app "123456789" --version "1.2.3" --build "BUILD_ID" --copy-metadata-from "1.2.2" --dry-run

# Full App Store publish
asc publish appstore --app "123456789" --ipa "/path/to/MyApp.ipa" --version "1.2.3" --submit --confirm

# Check status
asc status --app "123456789"

# Validate readiness
asc validate --app "123456789" --version "1.2.3"

# Run a workflow
asc workflow run release
```
