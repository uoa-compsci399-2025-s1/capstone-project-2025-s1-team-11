#!/usr/bin/env node
// client/src/testing/scripts/lefthookCheckConfig.js

import { spawnSync } from 'child_process';

// Get the config key from command line argument
const configKey = process.argv[2];

if (!configKey) {
    console.error('Error: No config key provided');
    process.exit(1);
}

// Check the git config value
const result = spawnSync('git', ['config', '--get', configKey], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
});

// If the command fails or returns 'false', exit with error
if (result.status !== 0 || result.stdout.trim() === 'false') {
    process.exit(1);
}

// Otherwise exit with success
process.exit(0);