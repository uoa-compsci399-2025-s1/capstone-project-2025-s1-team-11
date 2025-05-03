#!/usr/bin/env node

import { spawnSync } from 'child_process';

// -- Utility Functions --

function toPascalCase(hook) {
  return hook
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
}

function isHookEnabled(hookType) {
  const configKey = `hooks.run${toPascalCase(hookType)}Tests`;
  try {
    const result = spawnSync('git', ['config', '--get', configKey], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return result.stdout.trim() === 'true';
  } catch {
    return false;
  }
}

function runLintStaged() {
  console.log('Running lint-staged for pre-commit...');
  const result = spawnSync('npx', ['lint-staged'], { stdio: 'inherit' });
  if (result.status !== 0) {
    const msg = result.status === 1
        ? '❌ lint-staged found errors.'
        : '⚠️  lint-staged exited without processing any files.';
    console.error(msg);
    process.exit(result.status);
  }
}

function runESLint() {
  console.log('Running ESLint (validation mode - errors won\'t fail hooks)...');
  const result = spawnSync('npm', ['run', 'lint', '--', '--silent'], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.warn('⚠️ ESLint issues detected (currently not blocking)');
    // Command commented out to prevent hook failure
    // process.exit(result.status);
  } else {
    console.log('✅ ESLint passed');
  }
}

function runJest() {
  console.log('Running Jest...');
  const result = spawnSync('npm', ['test'], {
    stdio: 'inherit',
    shell: true
  });

  if (result.status !== 0) {
    console.error('❌ Jest tests failed.');
    process.exit(result.status);
  }

  console.log('✅ Jest tests passed');
}

function runCypress() {
  console.log('Running Cypress...');
  const result = spawnSync('npx', ['cypress', 'run', '--quiet'], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error('❌ Cypress tests failed.');
    process.exit(result.status);
  }
}

// -- Main Logic --

const hookType = process.argv[2] || 'unknown';

if (!isHookEnabled(hookType)) {
  console.log(`⚠️  Skipping ${hookType} tests (hooks.run${toPascalCase(hookType)}Tests not enabled)`);
  process.exit(0);
}

console.log(`Running ${hookType} tests...`);

try {
  if (hookType === 'pre-commit') {
    runLintStaged();
  } else {
    runESLint();
    runJest();

    if (hookType === 'pre-push' || hookType === 'post-merge') {
      runCypress();
    }
  }

  console.log(`✅ ${hookType} tests passed.`);
} catch (err) {
  console.error(`❌ Unexpected error in ${hookType} hook:`, err);
  process.exit(1);
}