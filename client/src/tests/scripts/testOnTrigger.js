#!/usr/bin/env node

import { spawnSync } from 'child_process';

const hookType = process.argv[2] || 'unknown';

// Converts kebab-case to PascalCase (e.g., pre-commit -> PreCommit)
function toPascalCase(hook) {
  return hook
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
}

const configKey = `hooks.run${toPascalCase(hookType)}Tests`;

let runTests = false;

try {
  const result = spawnSync('git', ['config', '--get', configKey], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  });

  const output = result.stdout.trim();
  if (output === 'true') runTests = true;
} catch {
  // config not set — stay false
}

if (!runTests) {
  console.log(`⚠️  Skipping ${hookType} tests (${configKey} not enabled)`);
  process.exit(0);
}

console.log(`🔍 Running ${hookType} tests...`);

try {
  if (hookType === 'pre-commit') {
    console.log('🔍 Running lint-staged for pre-commit...');
    const lintStaged = spawnSync('npx', ['lint-staged'], { stdio: 'inherit' });if (lintStaged.status !== 0) {
      if (lintStaged.status === 1) {
        console.error('❌ lint-staged found errors.');
      } else {
        console.warn('⚠️  lint-staged exited without processing any files.');
      }
      process.exit(lintStaged.status);
    }
    console.log(`✅ ${hookType} tests passed.`);
    process.exit(0);
  }

  console.log('🔍 Running ESLint...');
  const lint = spawnSync('npm', ['run', 'lint', '--', '--silent'], { stdio: 'inherit' });
  if (lint.status !== 0) {
    console.error('❌ ESLint failed.');
    process.exit(lint.status);
  }

  console.log('🔍 Running Jest...');
  const jest = spawnSync('npx', ['jest', '--ci', '--silent'], { stdio: 'inherit' });
  if (jest.status !== 0) {
    console.error('❌ Jest tests failed.');
    process.exit(jest.status);
  }

  if (hookType === 'pre-push' || hookType === 'post-merge') {
    console.log('🔍 Running Cypress...');
    const cypress = spawnSync('npx', ['cypress', 'run', '--quiet'], { stdio: 'inherit' });
    if (cypress.status !== 0) {
      console.error('❌ Cypress tests failed.');
      process.exit(cypress.status);
    }
  }

  console.log(`✅ ${hookType} tests passed.`);
} catch (err) {
  console.error(`❌ Unexpected error in ${hookType} hook:`, err);
  process.exit(1);
}
