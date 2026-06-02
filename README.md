# Nordic Conference — Playwright TypeScript Workshop

Welcome! This is the starter project for the **Playwright + TypeScript** workshop at Nordic Conference. To make the most of the session, please install everything **before** you arrive — the conference Wi-Fi will struggle if 200 people try to download browsers at once.

This repo includes a sample **Todo app test suite** (using the public [TodoMVC demo](https://demo.playwright.dev/todomvc)) so you can verify your setup works end-to-end.

---

## Prerequisites

Make sure the following are installed on your laptop before the conference:

| Requirement | Minimum Version | Check with |
|-------------|-----------------|------------|
| **Node.js** | (LTS recommended: 20.x or 22.x) | `node --version` |
| **npm**     | 9.x or newer | `npm --version` |
| **Git**     | Any recent version | `git --version` |
| **VS Code** (or any editor) | Latest | — |

### Recommended VS Code extensions
- [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) — run/debug tests from the editor
- ESLint, Prettier (optional but nice)

### Operating system
Works on **macOS**, **Windows**, and **Linux**. Make sure you have at least **2 GB of free disk space** — the Playwright browsers (Chromium, Firefox, WebKit) are about 1 GB total.

---

## Setup — do this before the conference

### 1. Clone the repository
```bash
git clone <repo-url> nordic-conf-pw
cd nordic-conf-pw
```

### 2. Install npm dependencies
```bash
npm install
```

### 3. Install Playwright browsers
This downloads Chromium, Firefox, and WebKit (~1 GB):
```bash
npx playwright install
```

On Linux you may also need system dependencies:
```bash
npx playwright install --with-deps
```

### 4. Verify your setup — run the sample tests
```bash
npm test
```

You should see ~14 todo tests passing across multiple browsers. If you see green checkmarks — you're ready! 🎉

---

## Project structure

```
nordic-conf-pw/
├── tests/
│   ├── pages/
│   │   └── todo-page.ts        # Page Object Model for the todo app
│   ├── todo.spec.ts            # Sample todo app tests (14 tests)
│   └── example.spec.ts         # Basic Playwright examples
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json               # TypeScript configuration
├── package.json
└── README.md
```

---

## Running tests

| Command | What it does |
|---------|--------------|
| `npm test` | Run all tests headless across all browsers |
| `npm run test:headed` | Run tests with a visible browser window |
| `npm run test:ui` | Open Playwright's interactive UI mode (recommended for learning) |
| `npm run test:debug` | Run tests in debug mode (Playwright Inspector) |
| `npm run test:chromium` | Run only on Chromium |
| `npm run test:firefox` | Run only on Firefox |
| `npm run test:webkit` | Run only on WebKit (Safari engine) |
| `npm run report` | Open the last HTML test report |
| `npm run codegen` | Record a new test by clicking through the todo app |

### Run a single test file
```bash
npx playwright test tests/todo.spec.ts
```

### Run a single test by name
```bash
npx playwright test -g "should add a single todo item"
```

---

## What the sample tests cover

The `todo.spec.ts` file demonstrates the most common Playwright patterns:

- ✅ Navigating to a page and asserting on the title
- ✅ Filling inputs, clicking buttons, pressing keys
- ✅ Using `getByRole`, `getByTestId`, `getByPlaceholder` locators
- ✅ Filtering and chaining locators with `.filter()`
- ✅ Hovering, double-clicking, editing inline
- ✅ Web-first assertions (`toHaveText`, `toHaveClass`, `toBeVisible`)
- ✅ The Page Object Model pattern
- ✅ State persistence across reloads

---

## Troubleshooting

**`npx playwright install` is slow or fails**
You're probably behind a corporate proxy. Try `HTTPS_PROXY=http://your-proxy npx playwright install`.

**Tests fail with "Executable doesn't exist"**
You skipped step 3. Run `npx playwright install`.

**"Cannot find module '@playwright/test'"**
You skipped step 2. Run `npm install`.

**Linux: tests fail with missing shared libraries**
Run `npx playwright install --with-deps` (requires `sudo`).

**Mac: WebKit tests fail**
Make sure you ran `npx playwright install` — WebKit ships separately from Safari.

---

## Useful links

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best practices](https://playwright.dev/docs/best-practices)
- [TodoMVC demo app](https://demo.playwright.dev/todomvc)

---

See you at Nordic Conference! 🇳🇴🇸🇪🇩🇰🇫🇮🇮🇸
