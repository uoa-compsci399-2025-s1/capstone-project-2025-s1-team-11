# Git Hooks Setup Guide: Husky for CI/CD Testing

This guide explains how to set up and use Husky git hooks for our testing infrastructure. These hooks help ensure code quality by running tests and linting at specific points in the git workflow.

## What are Git Hooks?

Git hooks are scripts that run automatically when specific git events occur. Our implementation uses:

- **pre-commit**: Runs before finalizing a commit
- **pre-push**: Runs before pushing to a remote
- **post-merge**: Runs after merging or pulling

## Setup Instructions

### 1. Installation

Husky is already configured in our project. When you first clone the repo, run:

```bash
npm install
```

This will automatically install Husky hooks through the `huskyInstallFromClient.js` script.

### 2. Verify Installation

To verify hooks are properly installed and executable:

```bash
node client/src/tests/scripts/validateHooks.js
```

This script will:
- Run npm install in the client directory
- Check that .husky directory exists with proper permissions
- Simulate each hook to verify functionality

### 3. Enable/Disable Hooks

Hooks are configurable through git config, by default these are DISABLED. Enable or disable specific hooks with:

```bash
# Enable pre-commit tests
git config hooks.runPreCommitTests true

# Enable pre-push tests
git config hooks.runPrePushTests true 

# Enable post-merge tests
git config hooks.runPostMergeTests true

# Disable a hook (example)
git config hooks.runPrePushTests false
```

## What Each Hook Does

1. **pre-commit**:
    - Runs `lint-staged` to check only staged files
    - Ensures code style before committing

2. **pre-push**:
    - Runs ESLint across the codebase
    - Runs Jest unit tests
    - Will run Cypress when we implement E2E tests

3. **post-merge**:
    - Runs after pulling/merging code
    - Verifies that code still passes tests after updates
    - Same checks as pre-push

## Troubleshooting

### Hook Permission Issues (Windows)

If you're using PowerShell on Windows, you might encounter permission issues. The `checkHooks.js` script attempts to fix these, but you may need to:

1. Run git commands from Git Bash instead of PowerShell
2. Or use WSL for better compatibility
3. If hooks aren't running, check their executable status:
   ```bash
   node client/src/tests/scripts/checkHooks.js
   ```

### Skipping Hooks (Emergency Only)

In urgent situations, you can bypass hooks with:

```bash
git commit --no-verify
git push --no-verify
```

**Note:** Use sparingly! Skipping hooks can lead to broken code reaching the repo.

## Understanding the Implementation

Our hooks use a common script (`testOnTrigger.js`) that:
1. Checks if the hook is enabled via git config
2. Runs the appropriate tests based on the hook type
3. Provides clear console output about what's running

## Future Considerations

Currently Cypress E2E tests are configured in the hooks but commented out in the implementation. As we adopt E2E testing, these will be gradually enabled.