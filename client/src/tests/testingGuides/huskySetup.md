# Git Hooks with Husky: Setup Guide

## Overview

This guide explains how to set up and use [Husky](https://typicode.github.io/husky/) with Assessly. Husky helps automate testing during Git operations by running specified scripts at key points in the Git workflow.

**Important**: Unlike most of Assessly's development which happens in the `/client` directory, Husky must be installed at the project root level where the `.git` directory is located.

## Why at the Root Level?

Git hooks interact directly with your repository's `.git` directory, which is at the project root. Husky creates a `.husky` directory at the same level as `.git` to store the hook scripts.

## Installation

### Prerequisites
- Node.js installed
- Git repository initialized

### Step 1: Install Husky at the Project Root

Navigate to the project root (not the client directory):

```bash
# If you're currently in the client directory
cd ..

# At the project root
npm install
```

This will:
1. Install Husky as a dev dependency (defined in the root package.json)
2. Run the "prepare" script that initializes Husky
3. Set up the necessary Git hooks

### Step 2: Verify Installation

To verify Husky is properly installed:

```bash
ls -la .husky
```

You should see these hook files:
- `pre-commit` - Runs before commits
- `pre-push` - Runs before pushing to remote
- `post-merge` - Runs after merging branches

### Step 3: Enable Test Hooks (Optional)

By default, the test scripts in hooks are disabled for your convenience. To enable them:

```bash
# Enable individual hooks
git config --local hooks.runPreCommitTests true
git config --local hooks.runPrePushTests true
git config --local hooks.runPostMergeTests true

# Or enable all at once
git config --local hooks.runPreCommitTests true && \
git config --local hooks.runPrePushTests true && \
git config --local hooks.runPostMergeTests true
```

## How Assessly's Hooks Work

### Hook Configuration

| Hook | When It Runs | What It Does |
|------|-------------|--------------|
| pre-commit | Before each commit | Runs ESLint and basic unit tests |
| pre-push | Before pushing to remote | Runs full test suite (including Cypress if enabled) |
| post-merge | After merging branches | Validates the project after new code is merged |

All hooks use the same script (`client/src/tests/scripts/testOnTrigger.js`) and pass their hook type as a parameter.

### Disabling Hooks Temporarily

#### Disable Specific Hooks

To disable a specific hook type:

```bash
git config --unset hooks.runPreCommitTests
git config --unset hooks.runPrePushTests
git config --unset hooks.runPostMergeTests
```

#### Skip Hooks for a Single Command

To skip hooks for a single Git command:

```bash
git commit --no-verify -m "Your commit message"
git push --no-verify
```

## Troubleshooting

### Hook Permission Issues

If you encounter permission errors:

```bash
chmod +x .husky/pre-commit .husky/pre-push .husky/post-merge
```

### Windows-Specific Issues

On Windows:
- Use Git Bash or another shell that supports shell scripts
- If using PowerShell or CMD, you may need additional configuration

### "husky install command is DEPRECATED" Warning

If you see this warning:
1. Edit the root package.json file
2. Change: `"prepare": "husky install && ..."`
3. To: `"prepare": "husky && ..."`

### "cannot find module" Errors

If Node can't find modules:
1. Make sure npm install was run at both the root and in the client directory
2. Check that paths in scripts use the correct relative paths

## Advanced Usage

### Manually Testing Hooks

You can manually run any hook's tests:

```bash
node client/src/tests/scripts/testOnTrigger.js pre-commit
node client/src/tests/scripts/testOnTrigger.js pre-push
node client/src/tests/scripts/testOnTrigger.js post-merge
```

### Understanding the Code

- Hook scripts are in `.husky/` at the project root
- The main test logic is in `client/src/tests/scripts/testOnTrigger.js`
- Permission checking is in `client/src/tests/scripts/checkHooks.js`

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [Git Hooks Documentation](https://git-scm.com/docs/githooks)
