# QA & Verification Rules

## When to Verify

- **After implementing feature** — once qualifying code edits are made in a feature session, invoke `/qa` before claiming done.
- **After fixing bug** — once qualifying code edits are made in a bug-fix session, invoke `/qa` before claiming fix done.
- **When explicitly asked** — user can run `/qa` anytime.

## Verification Requirements

- `/qa` must test the local app only
- `/qa` must use browser-use in iPhone 16 Pro view
- `/qa` must log in with the shared test user for protected flows
- A success claim is only valid after the latest qualifying code state passes `/qa`
- If QA is blocked or still failing after retries, report blocked/failing status instead of success

## When to Deploy

- **When finishing development branch** — after `/qa` passes, invoke `/deploy`.
- **When explicitly asked** — user can run `/deploy` anytime.
- `/deploy` requires `/qa` passed first. If not, run `/qa` first.
