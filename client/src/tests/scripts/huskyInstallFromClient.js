// client/src/tests/scripts/huskyInstallFromClient.js
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const huskyDir = path.resolve(__dirname, '../../../../.husky');
const checkHooksPath = path.resolve(__dirname, './checkHooks.js');

if (existsSync(huskyDir)) {
    try {
        execSync('npx husky install', { cwd: huskyDir, stdio: 'inherit' });
        console.log('✅ Husky hooks installed from /client during npm install');
    } catch (e) {
        console.error('❌ Failed to install Husky hooks:', e.message);
    }
} else {
    console.warn('⚠️ .husky directory not found at project root.');
}

// ✅ Run checkHooks.js after Husky install
if (existsSync(checkHooksPath)) {
    try {
        execSync(`node ${checkHooksPath}`, { stdio: 'inherit' });
        console.log('✅ checkHooks.js executed successfully');
    } catch (e) {
        console.error('❌ checkHooks.js failed:', e.message);
    }
} else {
    console.warn('⚠️ checkHooks.js not found at expected path.');
}