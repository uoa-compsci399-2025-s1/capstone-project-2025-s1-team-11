#!/usr/bin/env node

import { spawnSync } from 'child_process';

const hookType = process.argv[2] || 'unknown';

// Convert to PascalCase to match config key (e.g., hooks.runPreCommitTests)
const configKey = `hooks.run${
    hookType.charAt(0).toUpperCase() + hookType.slice(1)
}Tests`;

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
  console.log('🔍 Running ESLint...');
  spawnSync('npm', ['run', 'lint', '--', '--silent'], { stdio: 'inherit' });

  console.log('🔍 Running Jest...');
  spawnSync('npx', ['jest', '--ci', '--silent'], { stdio: 'inherit' });

  if (hookType === 'pre-push' || hookType === 'post-merge') {
    console.log('🔍 Running Cypress...');
    spawnSync('npx', ['cypress', 'run', '--quiet'], { stdio: 'inherit' });
  }

  console.log(`✅ ${hookType} tests passed.`);
} catch (err) {
  console.error(`❌ ${hookType} tests failed.`);
  process.exit(1);
}
