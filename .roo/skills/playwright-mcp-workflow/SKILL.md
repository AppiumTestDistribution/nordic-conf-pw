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

## `planner_save_plan` — arg schema (must populate every field)

The MCP tool is strict (Zod-validated). Every suite needs `seedFile`, every test needs `file` and `steps`, and every step needs an `expect` array. Omitting any of these returns an `InvalidArgument` / Zod error like *"expected string, received undefined"* at `suites[*].seedFile` / `tests[*].file` / `tests[*].steps`.

Required shape:

```json
{
  "name": "Inventory Test Plan",
  "fileName": "specs/inventory.plan.md",
  "overview": "Tests for the inventory page covering auth, listing, sort, cart.",
  "suites": [
    {
      "name": "Cart Interactions",
      "seedFile": "tests/seed.spec.ts",
      "tests": [
        {
          "name": "Add single item to cart",
          "file": "tests/inventory/add-single-item.spec.ts",
          "steps": [
            {
              "perform": "Click the 'Add to cart' button on the first product",
              "expect": [
                "Button label changes to 'Remove'",
                "Cart badge increments to 1"
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Rules:
- `seedFile` — always `tests/seed.spec.ts` in this repo (the scaffold from `init-agents`).
- `file` — full path, fs-friendly kebab-case, ending in `.spec.ts`, e.g. `tests/<suite>/<scenario>.spec.ts`.
- `steps[*].perform` is optional; `steps[*].expect` is **required** and must be an array of strings (use `[]` if truly nothing to assert, but prefer at least one assertion per step).
- Do not pass markdown-formatted prose in place of these fields — the tool itself converts the structured payload into markdown.

### ⚠️ Pass `suites` as a real JSON array, NOT a stringified one

When the tool call is constructed, `suites` must be an actual array value in the arguments object — not a string containing JSON. Same for nested `tests` and `steps` arrays.

```jsonc
// ✅ CORRECT — suites is a real array
{
  "name": "...",
  "fileName": "specs/x.plan.md",
  "overview": "...",
  "suites": [ { "name": "...", "seedFile": "...", "tests": [ ... ] } ]
}

// ❌ WRONG — suites is a string (will fail Zod: "expected array, received string")
{
  "name": "...",
  "fileName": "specs/x.plan.md",
  "overview": "...",
  "suites": "[{\"name\":\"...\",\"seedFile\":\"...\",\"tests\":[...]}]"
}
```

If you find yourself building the suites array as a string and then assigning it, **stop and emit it as a structured value instead**. The MCP server validates with strict Zod — strings will not be auto-parsed back into arrays.

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