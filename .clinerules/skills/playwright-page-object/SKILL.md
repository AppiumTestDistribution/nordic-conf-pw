---
name: playwright-page-object
description: Compact reference for organising Playwright tests with page objects. Use when adding a new page or refactoring a spec that has grown messy. Not a style lecture — see sibling skills for locators, fixtures, debugging, etc.
---

# Page objects — the short version

Page objects are *one* tool for keeping specs readable. Reach for them when a page is used by ≥2 tests or a spec is getting noisy. Don't introduce them just to follow a pattern.

Working examples already in this repo:
- `pages/login.page.ts`
- `pages/inventory.page.ts`
- `tests/fixtures.ts` (how the page objects get into tests)

## Five rules, no lectures

1. **One file per page**, named `<thing>.page.ts`, class `<Thing>Page`.
2. **Locators are `private readonly`**, set in the constructor. Don't expose selectors to tests.
3. **Methods are user intent** (`login(user, pass)`), not mechanics (`clickAndType`).
4. **No `expect()` inside the page object** — assertions live in the spec so the test reads like a spec. Expose locators/getters for the test to assert on.
5. **No work in the constructor** — give it an explicit `goto()`.

That's it. If a page object grows past ~80 lines, split it.

## When NOT to use a page object

- One-off exploratory test → just inline the locators.
- A single button on a shared component → a helper function is fine.
- Hybrid API+UI tests where the UI is one step → don't build a class for it.

## Reference

See `examples/todo.page.ts` for a minimal shape, and `pages/login.page.ts` in this repo for a real one used by the fixture in `tests/fixtures.ts`.

Workshop exercises in `.roo/WORKSHOP_GUIDE.md`.
