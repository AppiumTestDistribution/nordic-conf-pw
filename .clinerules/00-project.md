# Playwright workshop — project rules (Cline)

This repo is the **Nordic Conference Playwright workshop**. App under test is **TodoMVC** at `https://demo.playwright.dev/todomvc` (set as `baseURL` in `playwright.config.ts`).

House style + workflow guidance live as on-demand skills under `.clinerules/skills/`.

## Skills available (load on-demand when relevant)

- `playwright-mcp-workflow` — orchestrator: when to use the test MCP, when to invoke an agent, when to just edit files. Read first for any Playwright task.
- `playwright-page-object` — when/how to use POM. Has a TodoMVC example at `.clinerules/skills/playwright-page-object/examples/todo.page.ts` — directly relevant to this project.
- `playwright-locators` — locator priority + auto-wait + web-first assertions
- `playwright-fixtures-auth` — custom fixtures, storage state, test isolation
- `playwright-debugging` — UI mode, codegen, trace viewer, page.pause
- `playwright-bug-hunting` — broken-image audits, console/5xx guards, a11y
- `playwright-network-mocking` — page.route, HAR record/replay
- `playwright-api-testing` — request fixture, hybrid UI + API tests

## MCP gotcha — must read

The MCP server `playwright-test` (`npx playwright run-test-mcp-server`) is a **test runner** MCP, not a raw browser driver. Every `browser_*` call must live inside a Playwright test context.

**Before any `browser_*` call in a free-form session, call `planner_setup_page` first.** Otherwise the server returns *"must setup test before interacting with the page."*

When invoking a Test Agent (planner/generator/healer in `.claude/agents/`), the agent's own setup tool handles this automatically.

## Reference code in this repo

- `tests/todo.spec.ts` — current example spec (add a todo item)
- `tests/seed.spec.ts` — seed test used by Test Agents (created by `init-agents`)
- `playwright.config.ts` — `baseURL: https://demo.playwright.dev`, trace on first retry, screenshot + video on failure
- `specs/` — where the Planner agent saves test plans

No `pages/`, `tests/fixtures.ts`, or auth flow exists yet — those are patterns attendees build during the workshop. The skill examples (TodoMVC `todo.page.ts`, fixture/auth patterns) show the target style.

## House style — quick anchors

- **Locators**: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByTestId`. The existing test uses `getByPlaceholder` and `getByTestId` — both good. Avoid CSS chains / positional XPath.
- **Waits**: never `page.waitForTimeout()`; let `await expect(locator)...` do the waiting.
- **Auth**: prefer fixtures + `storageState` files over re-logging in each test (NB: TodoMVC has no auth — relevant pattern when attendees move to apps that do).
- **Assertions**: web-first only — `await expect(locator).toX(...)`, never `expect(await locator.textContent()).toBe(...)`.

For session flow, exercises, and the Cline-specific setup steps attendees follow, see `.roo/WORKSHOP_GUIDE.md`.

## Keeping Roo and Cline skills in sync

`.roo/skills/` is the canonical location; `.clinerules/skills/` is a mirror so Cline picks them up. After editing any SKILL.md, run `npm run skills:sync` to update the mirror, or `npm run skills:check` to confirm they match.
