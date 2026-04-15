# QA & Verification Rules

## When to Verify

- **After implementing feature** — when brainstorming workflow reaches verification phase, invoke `/qa` before claiming done.
- **After fixing bug** — when systematic-debugging workflow reaches verification phase, invoke `/qa` before claiming fix done.
- **When explicitly asked** — user can run `/qa` anytime.

## When to Deploy

- **When finishing development branch** — after `/qa` passes, invoke `/deploy` to push and ship to TestFlight.
- **When explicitly asked** — user can run `/deploy` anytime.
- `/deploy` requires `/qa` passed first. If not, runs `/qa` automatically.