# ASC Environment Variables

## Authentication

| Variable | Purpose |
|----------|---------|
| `ASC_KEY_ID` | API Key ID (fallback when keychain unavailable) |
| `ASC_ISSUER_ID` | API Issuer ID |
| `ASC_PRIVATE_KEY_PATH` | Path to .p8 private key file |
| `ASC_PRIVATE_KEY` | Private key content (inline) |
| `ASC_PRIVATE_KEY_B64` | Base64-encoded private key |
| `ASC_BYPASS_KEYCHAIN` | Set to `1` to ignore keychain, use config/env auth |
| `ASC_STRICT_AUTH` | Fail when credentials resolve from multiple sources |
| `ASC_PROFILE` | Select named authentication profile |

## Application Defaults

| Variable | Purpose |
|----------|---------|
| `ASC_APP_ID` | Default app ID for commands |
| `ASC_VENDOR_NUMBER` | Vendor number for financial/sales reports |

## Timeouts

| Variable | Purpose |
|----------|---------|
| `ASC_TIMEOUT` | Request timeout (e.g., `90s`, `2m`) |
| `ASC_TIMEOUT_SECONDS` | Request timeout in seconds |
| `ASC_UPLOAD_TIMEOUT` | Upload timeout (e.g., `60s`, `2m`) |
| `ASC_UPLOAD_TIMEOUT_SECONDS` | Upload timeout in seconds |

## Output & Debugging

| Variable | Purpose |
|----------|---------|
| `ASC_DEFAULT_OUTPUT` | Default output format: `json`, `table`, `markdown`, `md` |
| `ASC_DEBUG` | Enable debug logging (set to `api` for HTTP request/response logs) |

## Credential Resolution Order

1. Selected profile (keychain or config)
2. Environment variables (fallback)
3. System keychain
4. `~/.asc/config.json` (global config)
5. `./.asc/config.json` (repo-local config, highest precedence)

## Output Format Priority

1. Explicit `--output` flag (highest)
2. `ASC_DEFAULT_OUTPUT` environment variable
3. TTY-aware default: `table` for terminals, `json` for pipes/CI
