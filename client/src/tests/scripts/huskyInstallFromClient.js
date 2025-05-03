#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../../../');

// Run husky installation from project root
try {
    execSync('npx husky install', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Husky installed from /client during npm install');
} catch (e) {
    console.error('❌ Failed to install Husky hooks:', e.message);
}