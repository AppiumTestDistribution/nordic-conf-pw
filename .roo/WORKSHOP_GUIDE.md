# Playwright Workshop — Instructor Guide

This is the **human-facing** companion to the skills under `.roo/skills/` and `.clinerules/skills/`. The skills are for the AI assistant (Roo / Cline / Claude Code). This guide is for **you, the instructor**: session flow, exercises, demo scripts.

## Setup (do once before the workshop)

```bash
npm install
npx playwright install chromium
# Already done in this repo:
#   .roo/mcp.json        → playwright-test MCP (Roo reads this — project-level)
#   .mcp.json            → playwright-test MCP (Claude Code reads this — project-level)
#   .clinerules/         → Cline rules + skills (Cline reads this — project-level)
#   .claude/agents/      → planner, generator, healer (created by init-agents)
#   specs/, tests/seed.spec.ts
```

Smoke-check before attendees arrive:

```bash
npx playwright test --reporter=line     # existing tests pass
npx playwright test --ui                # UI mode opens
```

## Attendee setup — which AI client?

| Client | What "just works" from repo | What attendee must do once |
|---|---|---|
| **Cline** (most attendees) | `.clinerules/00-project.md` + `.clinerules/skills/` are auto-loaded | Paste MCP snippet into Cline's **global** settings — see below |
| Roo Code | `.roo/mcp.json` + `.roo/skills/` | Nothing — Roo reads project files |
| Claude Code | `.mcp.json` + `.claude/agents/` | Nothing — Claude Code reads project files |

## Cline-specific setup

Cline does not (yet) support project-level MCP config. Attendees have to add the MCP server to their **global** Cline settings once. Walk them through this at the start of the session:

### Easy path (recommended) — one command

```bash
npm run cline:setup
```

This merges the `playwright-test` MCP server entry into the attendee's global `cline_mcp_settings.json` and points it at `scripts/mcp-launcher.cjs` (absolute path). The launcher is needed because Cline launches MCP servers from VS Code's install dir, not the workspace — Cline issue [#2635](https://github.com/cline/cline/discussions/2635) — so without it the MCP server can't resolve `tests/seed.spec.ts` and returns *"seed test not found."* The launcher `cd`s to the project root before exec.

Then reload VS Code (`Cmd/Ctrl-Shift-P` → "Developer: Reload Window") and Cline sees the server.

> ⚠️ **One-project-at-a-time in Cline**: because Cline's MCP config is global and the launcher path is absolute, only the project that most recently ran `cline:setup` is "active" in Cline. To switch projects, `cd` into the other one and re-run `npm run cline:setup` + reload. (Roo doesn't have this constraint — it uses `.roo/mcp.json` per project.)

### Manual path (if the script can't run)

**Step 1 — Open Cline's MCP settings**
- Open the Cline panel in VS Code
- Click the **MCP Servers** icon in the top nav
- Click **Configure MCP Servers** — this opens `cline_mcp_settings.json`

(Or open the file directly:
- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`)

**Step 2 — Paste this server config** (merge into existing `mcpServers` if attendees already have entries):

```json
{
  "mcpServers": {
    "playwright-test": {
      "command": "npx",
      "args": ["playwright", "run-test-mcp-server"],
      "alwaysAllow": [
        "browser_snapshot",
        "browser_navigate",
        "planner_setup_page"
      ],
      "disabledTools": [
        "browser_run_code_unsafe",
        "browser_drag", "browser_drop", "browser_file_upload",
        "browser_handle_dialog", "browser_take_screenshot",
        "browser_navigate_back", "browser_navigate_forward",
        "browser_resize", "browser_close", "browser_console_clear",
        "browser_mouse_click_xy", "browser_mouse_down", "browser_mouse_up",
        "browser_mouse_move_xy", "browser_mouse_drag_xy", "browser_mouse_wheel",
        "browser_keydown", "browser_keyup", "browser_press_sequentially",
        "browser_cookie_clear", "browser_cookie_delete", "browser_cookie_get",
        "browser_cookie_list", "browser_cookie_set",
        "browser_localstorage_clear", "browser_localstorage_delete",
        "browser_localstorage_get", "browser_localstorage_list", "browser_localstorage_set",
        "browser_sessionstorage_clear", "browser_sessionstorage_delete",
        "browser_sessionstorage_get", "browser_sessionstorage_list", "browser_sessionstorage_set",
        "browser_start_tracing", "browser_stop_tracing",
        "browser_start_video", "browser_stop_video", "browser_video_chapter",
        "browser_pdf_save", "browser_annotate",
        "browser_highlight", "browser_hide_highlight"
      ]
    }
  }
}
```

**Step 3 — Save and reload**
Reload VS Code (Cmd/Ctrl-Shift-P → "Developer: Reload Window"). The Cline MCP panel should show `playwright-test` connected with ~33 tools.

**Step 4 — Smoke-check the agent**
In Cline, try: *"Use planner_setup_page then navigate to http://localhost:5173/login and snapshot the page."* If you get a structured snapshot back, you're set.

> ⚠️ **The `planner_setup_page` first** rule (in `.clinerules/00-project.md`) is critical. Without it, every browser call returns *"must setup test before interacting with the page."* The first attendee question is usually about this — point them at the project rules file.

## Keeping skills in sync (Roo ↔ Cline)

`.roo/skills/` is the canonical home; `.clinerules/skills/` is a mirror so Cline finds them. Two npm scripts manage this:

```bash
npm run skills:sync     # mirror .roo/skills → .clinerules/skills
npm run skills:check    # verify they match (CI-friendly, exits non-zero on drift)
```

After editing any SKILL.md (in either location), run `skills:sync` from the canonical one. A pre-commit hook is overkill for a workshop — just remember to sync before pushing.

## Suggested 3-hour session flow

| Block | Time | Focus | Skills used |
|---|---|---|---|
| Warm-up | 15m | Run the suite, open `--ui`, walk through one test | none |
| Resilient locators | 25m | Why role/label > CSS. Live demo with `codegen`. | `playwright-locators` |
| Fixtures + auth | 30m | Replace `beforeEach` with fixtures; storage state speedup | `playwright-fixtures-auth` |
| Break | 10m | | |
| Debugging | 20m | Trace viewer, `--debug`, `page.pause` — fix a planted bug | `playwright-debugging` |
| Bug hunting | 25m | Find the broken Desk Lamp image; add console-error guard | `playwright-bug-hunting` |
| Network mocking | 20m | Force empty inventory; HAR record/replay demo | `playwright-network-mocking` |
| **AI segment** | 25m | Planner → Generator → Healer on the inventory feature | `playwright-mcp-workflow` |
| Wrap | 10m | Q&A, where to go next | |

## Exercises

These are the exercises previously embedded in each SKILL.md. Keeping them here makes the skills lean and gives you one place to evolve them.

### Locators

Open `pages/login.page.ts`. It uses `[data-test="username"]` etc. Rewrite one as `getByLabel('Username')` and re-run the suite. Discuss: which is more resilient, and when?

### Fixtures + auth

`tests/example.spec.ts` re-logs-in for every test. Convert:
1. Add a `globalSetup` that logs in once, saves `playwright/.auth/user.json`.
2. Set `use.storageState` in `playwright.config.ts`.
3. Delete login steps from non-login tests.
4. Compare runtimes before/after.

### Debugging

Plant a bug: change `'Sign in'` to `'Login'` in `pages/login.page.ts`. Run with `--ui`. Have attendees identify the failure step from the time-travel view *without* reading the error message.

### Bug hunting

1. Run the existing broken-image test (`'finds products with broken or mismatched images'`) — show how it finds a bug nobody planted explicitly.
2. Add a global console-error listener to `tests/fixtures.ts`. Re-run the suite. Anything break?
3. Pick a page. Mock its API to return an empty array with `page.route`. Write an assertion for the empty state. Did the empty state actually exist, or did the app crash?

### Network mocking

1. `page.route('**/api/products', ...)` to return **empty array**. Update inventory test for empty state — does the app handle it or crash?
2. Record a HAR by visiting `/inventory` once. Stop the dev server. Re-run via `routeFromHAR` — should still pass.
3. `route.continue` after a 2s delay on `/api/products`. Watch the loading spinner in `--ui`. Is there one? Or does the app go blank?

### API testing

Take `'allows standard user to sign in'`. Rewrite as a **pure API test** against `/api/login` that asserts the response. Then a **hybrid test**: API login + UI inventory assertion (no UI login). Time all three (original / pure API / hybrid).

## AI segment — Planner → Generator → Healer

This is the headline demo. New in Playwright 1.56+. Attendees will not have seen this.

### Step 1: Plan

In Claude Code (this repo is set up for it via `.claude/agents/`):

> Use the playwright-test-planner agent to create a test plan for the inventory page. Save it to `specs/inventory.md`.

The agent will navigate the app via the browser MCP, snapshot pages, and write a markdown plan to `specs/inventory.md`.

### Step 2: Generate

> Use the playwright-test-generator agent to create tests from `specs/inventory.md`. Follow the patterns in `pages/inventory.page.ts` and `tests/fixtures.ts`.

The Generator writes `tests/<scenario>.spec.ts` files, verifying selectors against the live app as it goes. Mentioning the skills + existing pages keeps it on house style.

### Step 3: Heal

Plant a small bug (rename a button, change a path). Run the suite — it fails. Then:

> Use the playwright-test-healer agent to fix the failing tests.

The Healer runs in debug mode, inspects trace/console/network, and patches the test. If it decides the *feature* is broken (not the test), it skips with a comment.

### Talking points

- The agents work because the app is **observed live**, not guessed at — that's the MCP advantage.
- The Generator only does well if the **house style is in the skills**. Without `playwright-locators` etc. loaded, it produces generic tests.
- The Healer is not a silver bullet — it tries hard, but a broken feature stays broken. Good thing.

## Where to point attendees afterwards

- Playwright docs: https://playwright.dev
- Playwright Test Agents: https://playwright.dev/docs/test-agents
- This repo's `.roo/skills/` — they can copy the pattern into their own projects
- `npx playwright init-agents --loop=<their-tool>` to bootstrap agents in their own repos
