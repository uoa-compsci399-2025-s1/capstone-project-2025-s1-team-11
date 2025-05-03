#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../../../');
const huskyDir = path.resolve(projectRoot, '.husky');
const testOnTriggerPath = path.join(__dirname, 'testOnTrigger.js').replace(/\\/g, '/');

// Define hooks to create
const hooks = [
    { name: 'pre-commit', command: `node "${testOnTriggerPath}" pre-commit` },
    { name: 'pre-push', command: `node "${testOnTriggerPath}" pre-push` },
    { name: 'post-merge', command: `node "${testOnTriggerPath}" post-merge` }
];

console.log('Setting up Husky hooks...');

// Ensure husky directory exists
if (!fs.existsSync(huskyDir)) {
    console.log('Creating .husky directory...');
    fs.mkdirSync(huskyDir, { recursive: true });
}

for (const hook of hooks) {
    try {
        const hookPath = path.join(huskyDir, hook.name);
        const isWindows = process.platform === 'win32';

        // Create hook file content
        const hookContent = isWindows
            ? `#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\n${hook.command}\n`
            : `#!/bin/sh\n. "$(dirname -- "$0")/_/husky.sh"\n\n${hook.command}\n`;

        // Write hook file
        fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });

        console.log(`✅ Created ${hook.name} hook`);

        // Make executable on Unix systems
        if (!isWindows) {
            execSync(`chmod +x "${hookPath}"`);
        }
    } catch (error) {
        console.error(`❌ Error creating ${hook.name} hook:`, error.message);
    }
}

// Create _/husky.sh if it doesn't exist
const huskyShDir = path.join(huskyDir, '_');
const huskyShPath = path.join(huskyShDir, 'husky.sh');

if (!fs.existsSync(huskyShDir)) {
    fs.mkdirSync(huskyShDir, { recursive: true });
}

if (!fs.existsSync(huskyShPath)) {
    console.log('Creating husky.sh helper script...');
    try {
        // This is a simplified version of husky.sh
        const huskyShContent = `#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename -- "$0")"
  debug "starting $hook_name..."
fi
`;
        fs.writeFileSync(huskyShPath, huskyShContent, { mode: 0o755 });

        // Make executable on Unix systems
        if (process.platform !== 'win32') {
            execSync(`chmod +x "${huskyShPath}"`);
        }

        console.log('✅ Created husky.sh helper script');
    } catch (error) {
        console.error('❌ Error creating husky.sh helper script:', error.message);
    }
}

console.log('Hook setup complete.');