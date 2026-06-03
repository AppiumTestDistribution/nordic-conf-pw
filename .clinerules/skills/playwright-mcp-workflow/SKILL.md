---
name: playwright-mcp-workflow
description: Decide WHEN to drive the browser MCP, WHEN to invoke a Playwright Test Agent (planner/generator/healer), and WHEN to just edit files. The orchestrator skill — read this first when a Playwright task comes in.
---

# When to use which tool

This repo has three different ways the AI can affect Playwright work. Pick by intent:


| User intent                                                      | Use                                                                                                         |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| "Write/refactor this test"                                       | Edit files directly + the authoring skills below                                                            |
| "Explore this page" / "what does X look like" / "find bugs live" | `**playwright-test` browser tools** (`browser_navigate`, `browser_snapshot`, `browser_console_messages`, …) |
| "Plan tests for the whole app / this feature"                    | **Planner agent** (`.claude/agents/playwright-test-planner.md`)                                             |
| "Turn this plan into tests"                                      | **Generator agent** (`.claude/agents/playwright-test-generator.md`)                                         |
| "Fix these failing tests"                                        | **Healer agent** (`.claude/agents/playwright-test-healer.md`)                                               |
| "Run this test and tell me what failed"                          | `npx playwright test ...` via Bash + trace                                                                  |


## MCP server in this repo

One server: `**playwright-test`** (`playwright run-test-mcp-server`). It exposes both:

- **Browser-driving tools** (`mcp__playwright-test__browser_`*) — for live exploration, ad-hoc UI driving, bug-hunting demos.
- **Agent-orchestration tools** (`planner_`*, `generator_*`, `healer_*`) — invoked indirectly through the Test Agents in `.claude/agents/`.

> We deliberately don't run `@playwright/mcp` separately — `playwright-test` already exposes the browser tools, and stacking both blows past the ~60-tool limit that confuses the model.

## Browser tools (via `mcp__playwright-test__`)

```
browser_navigate(url)
browser_snapshot()                 # accessibility tree of current page
browser_click(element, ref)
browser_type(element, ref, text)
browser_evaluate(function)
browser_console_messages()         # captured JS errors / warnings
browser_network_requests()         # captured HTTP traffic
browser_take_screenshot()
browser_fill_form([{...}])
browser_wait_for({ text | textGone | time })
```

Use `browser_snapshot` over `browser_take_screenshot` by default — it's structured (accessibility tree), faster, cheaper, and you don't need vision to act on it.

## ⚠️ Setup required before any `browser_*` call

`playwright-test` is a **test runner** MCP — every browser call must live inside a Playwright test context. Calling `browser_navigate` cold returns *"must setup test before interacting with the page."*

**Always start a free-form browser session with:**

```
planner_setup_page          # establishes test context
browser_navigate(url)       # now works
browser_snapshot()
...
```

`planner_setup_page` is the right call for any non-agent exploration (it's in `alwaysAllow`). When you *are* invoking an agent, the agent's own setup step (`planner_setup_page` / `generator_setup_page` / `healer_setup_page`) handles this automatically.

## Test Agents — invocation

The agents are in `.claude/agents/`. Workflow:

1. **Planner** → `specs/<feature>.md` (markdown test plan)
2. **Generator** → reads a spec, writes `tests/<scenario>.spec.ts`, verifying selectors live
3. **Healer** → runs the suite, patches failures using trace/console/network

Invoke in Claude Code with natural language, e.g. "Use the planner agent on the inventory page." The agent uses `playwright-test` MCP tools internally.

> The Generator should follow this repo's house style — see the authoring skills below. When you invoke it, make sure those skills are loaded so generated tests match the patterns in `pages/` and `tests/fixtures.ts`.

## Authoring skills (house style for hand-written + generated code)

- `[[playwright-page-object]]` — when/how to use POM
- `[[playwright-locators]]` — locator priority + auto-wait
- `[[playwright-fixtures-auth]]` — custom fixtures, storage state, isolation
- `[[playwright-debugging]]` — UI mode, codegen, trace viewer
- `[[playwright-bug-hunting]]` — finding real bugs (broken images, console guards, a11y)
- `[[playwright-network-mocking]]` — page.route, HAR, deterministic CI
- `[[playwright-api-testing]]` — request fixture, hybrid tests

## Decision flow

```
User asks something Playwright-related
  ├─ "what does X look like" / "explore" / "find bugs live"
  │     → playwright-test browser tools (snapshot, console, network)
  ├─ "plan tests for…"
  │     → invoke Planner agent
  ├─ "generate tests from this plan"
  │     → invoke Generator agent (load authoring skills first)
  ├─ "these tests fail / fix them"
  │     → Healer agent OR debugging skill if it's one test
  ├─ "write/refactor a specific test"
  │     → edit files using authoring skills, then run via Bash
  └─ unsure
        → `browser_snapshot` first to see the app, then pick from above
```

## Anti-patterns

- Calling `playwright-test` MCP tools directly instead of through an agent — the agents are designed to orchestrate those tools; raw calls bypass their logic.
- Using `browser_take_screenshot` when `browser_snapshot` would do — wastes tokens and gives you pixels instead of structure.
- Generating tests without the authoring skills loaded — output won't match the repo's house style.
- Running the Healer on a *missing* feature — it'll keep retrying. If the functionality is broken (not the test), it skips. Don't fight it.

Workshop session plan in `.roo/WORKSHOP_GUIDE.md`.