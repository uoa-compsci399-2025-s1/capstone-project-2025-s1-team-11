#!/usr/bin/env node

import { execSync, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES module-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const clientDir = path.resolve(__dirname, '../../..');
const projectRoot = path.resolve(clientDir, '..');
const huskyDir = path.join(projectRoot, '.husky');

function logSection(title) {
    console.log(`\n=== ${title} ===`);
}

function run(cmd, args = [], opts = {}) {
    const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
    if (result.status !== 0) {
        console.error(`❌ Command failed: ${cmd} ${args.join(' ')}`);
        process.exit(result.status);
    }
}

// --- Start Validation ---
console.log('\nValidating Husky Hook Setup...\n');

// Step 1: Run npm install in /client
logSection('1. Running npm install in /client');
try {
    execSync('npm install', {
        cwd: clientDir,
        stdio: 'inherit',
    });
} catch {
    console.error('❌ npm install failed');
    process.exit(1);
}

// Step 2: Check .husky presence
logSection('2. Checking .husky permissions');
if (!fs.existsSync(huskyDir)) {
    console.log(`Checking for .husky at: ${huskyDir}`);
    console.warn('⚠️  .husky directory not found — skipping permission check.');
} else {
    console.log(`Found .husky at: ${huskyDir}`);
    run('node', [path.join(clientDir, 'src/tests/scripts/checkHooks.js')]);
}

// Step 3: Simulate hooks
const hooksToTest = ['pre-commit', 'pre-push', 'post-merge'];

for (const hook of hooksToTest) {
    logSection(`3. Simulating ${hook} hook`);

    const configKey = `hooks.run${hook
        .split('-')
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join('')}Tests`;

    try {
        const config = execSync(`git config --get ${configKey}`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();

        if (config !== 'true') {
            console.warn(`⚠️  ${hook} hook is disabled via Git config: ${configKey}`);
            continue;
        }
    } catch {
        console.warn(`⚠️  ${hook} hook not configured in Git (skipping test)`);
        continue;
    }

    run('node', [path.join(clientDir, 'src/tests/scripts/testOnTrigger.js'), hook]);
}

logSection('✅ Validation complete');
console.log('All checks passed if no errors above.\n');