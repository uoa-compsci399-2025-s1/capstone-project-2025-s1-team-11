#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const huskyDir = path.resolve('.husky');
if (!fs.existsSync(huskyDir)) {
    console.log('⚠️  .husky directory not found. Did you run `husky install`?');
    process.exit(0);
}

const hooks = fs.readdirSync(huskyDir).filter(file => !file.startsWith('_') && !file.endsWith('.sample'));

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
            execSync(`chmod +x "${fullPath}"`);
        }
        console.log('✅ Fixed hook permissions using chmod +x.');
    } catch (err) {
        console.error('❌ Failed to fix hook permissions:', err.message);
        process.exit(1);
    }
}
