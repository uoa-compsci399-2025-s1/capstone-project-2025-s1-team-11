
# Git Hooks Guide (Husky)

This guide explains how we use Git hooks with [Husky](https://typicode.github.io/husky/) to run automated tests during key Git lifecycle events.

## Purpose

These hooks are in place to help catch issues early and keep code quality high, without enforcing anything by default. Each developer can **opt in or out** of specific hook behaviors using their local Git config.

---

## Setup

If you haven't already, run this once:

```bash
npm install
npx husky install
```

> Ensure `prepare` script is present in your `package.json`:
```json
"scripts": {
  "prepare": "husky install"
}
```

---

## Hook Files

These files live in the `.husky/` directory and trigger a shared script:

| Hook        | File              | What It Does                        |
|-------------|-------------------|-------------------------------------|
| pre-commit  | `.husky/pre-commit` | Runs lint + Jest before commit     |
| pre-push    | `.husky/pre-push`   | Runs full test suite before push   |
| post-merge  | `.husky/post-merge` | Validates the project after merge  |

All hooks call the same script:
```
client/src/tests/scripts/testOnTrigger.js
```

---

## Developer Control: Opt-In with Git Config

By default, **tests are skipped** unless you explicitly enable them per event.

### Enable Tests for a Hook

```bash
git config --local hooks.runPreCommitTests true
git config --local hooks.runPrePushTests true
git config --local hooks.runPostMergeTests true
```

These settings are stored in your local `.git/config` file and are **not committed**.

### Disable Tests Again

```bash
git config --unset hooks.runPrePushTests
```

---

## What Each Hook Runs

- **pre-commit**: Lint + Jest (unit/integration tests)
- **pre-push**: Lint + Jest + Cypress (E2E)
- **post-merge**: Lint + Jest + Cypress

> The actual commands are defined in `testOnTrigger.js` and may evolve.

---

## Manual Execution (Optional)

You can run any test manually:
```bash
node client/src/tests/scripts/testOnTrigger.js pre-commit
```

This is helpful for debugging without committing/pushing.

---
