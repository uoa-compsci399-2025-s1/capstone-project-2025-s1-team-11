#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

// ES module-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use absolute path resolution like other scripts
const clientDir = path.resolve(__dirname, '../../..');
const projectRoot = path.resolve(clientDir, '..');
const huskyDir = path.join(projectRoot, '.husky');

// Warn PowerShell users on Windows
if (os.platform() === 'win32' && !process.env.SHELL?.includes('bash')) {
    console.warn('⚠️  Warning: You appear to be using PowerShell. Hook permission fixes may not apply unless run via Git Bash or WSL.');
}

// Gracefully exit if .husky directory doesn't exist
if (!fs.existsSync(huskyDir)) {
    console.log('⚠️  .husky directory not found — skipping permission check.');
    process.exit(0);
}

// Only proceed if hook scripts actually exist
const hooks = fs.readdirSync(huskyDir).filter(
    file => !file.startsWith('_') && !file.endsWith('.sample')
);

if (hooks.length === 0) {
    console.log('⚠️  .husky contains no hook scripts — skipping permission check.');
    process.exit(0);
}

let nonExecutableHooks = [];

for (const hook of hooks) {
    const hookPath = path.join(huskyDir, hook);
    try {
        fs.accessSync(hookPath, fs.constants.X_OK);
    } catch {
        nonExecutableHooks.push(hook);
    }
}

if (nonExecutableHooks.length === 0) {
    console.log('✅ All Husky hook scripts are executable.');
} else {
    console.log(`⚠️  The following hooks are not executable: ${nonExecutableHooks.join(', ')}`);

    try {
        for (const hook of nonExecutableHooks) {
            const fullPath = path.join(huskyDir, hook);
            console.log(`Fixing: ${hook}`);
            execSync(`chmod +x "${fullPath}"`);
        }
        console.log('✅ Fixed hook permissions using chmod +x.');
    } catch (err) {
        console.error('❌ Failed to fix hook permissions:', err.message);
        process.exit(1);
    }
}