# ASC CI/CD Integration

Source: `refs/App-Store-Connect-CLI/docs/CI_CD.md`

## GitHub Actions

```yaml
- uses: rudrankriyam/setup-asc@v1
  with:
    version: latest

- run: asc --help
```

Full examples: https://github.com/rudrankriyam/setup-asc

## GitLab CI/CD

```yaml
include:
  - component: gitlab.com/rudrankriyam/asc-ci-components/run@main
    inputs:
      stage: deploy
      job_prefix: release
      asc_version: latest
      command: asc --help
```

## Bitrise

```yaml
workflows:
  primary:
    steps:
    - git::https://github.com/rudrankriyam/steps-setup-asc.git@main:
        inputs:
        - mode: run
        - version: latest
        - command: asc --help
```

## CircleCI

Official orb: https://github.com/rudrankriyam/asc-orb

## CI Authentication

Use environment variables for headless auth:

```bash
export ASC_KEY_ID="YOUR_KEY_ID"
export ASC_ISSUER_ID="YOUR_ISSUER_ID"
export ASC_PRIVATE_KEY_PATH="/path/to/AuthKey.p8"
export ASC_BYPASS_KEYCHAIN=1
```

Or use base64-encoded key for secrets:
```bash
export ASC_PRIVATE_KEY_B64="$(base64 < AuthKey.p8)"
```
