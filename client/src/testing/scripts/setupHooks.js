#!/usr/bin/env node
// client/src/testing/scripts/setupHooks.js

import { spawnSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to prompt for yes/no questions
const promptYesNo = (question) => {
    return new Promise((resolve) => {
        rl.question(`${question} (y/n): `, (answer) => {
            resolve(answer.toLowerCase().startsWith('y'));
        });
    });
};

// Helper function to set git config value
const setGitConfig = (key, value) => {
    //console.log(`Setting ${key} to ${value}`);
    spawnSync('git', ['config', key, value], { stdio: 'inherit' });
};

// Main setup function
const setupHooks = async () => {
    console.log('==================================');
    console.log('Git Hooks Configuration Assistant');
    console.log('==================================\n');
    //console.log('This script will help you configure which git hooks run in your local environment.');
    //console.log('The team defaults are set in lefthook.yml, but you can customize your personal settings.');
    //console.log('\n');

    // Configure pre-commit hooks
    const runPreCommit = await promptYesNo('Do you want to run pre-commit hooks (lint-staged)?');
    setGitConfig('hooks.enablePreCommit', runPreCommit.toString());

    const runPrePush = await promptYesNo('Do you want to enable pre-push hooks?');
    setGitConfig('hooks.enablePrePush', runPrePush.toString());

    const runPostMerge = await promptYesNo('Do you want to enable post-merge hooks?');
    setGitConfig('hooks.enablePostMerge', runPostMerge.toString());

    // // Configure linting
    // const runLinting = await promptYesNo('Do you want to run ESLint checks?');
    // setGitConfig('hooks.skipLinting', (!runLinting).toString());
    //
    // // Configure Jest testing
    // const runJestTests = await promptYesNo('Do you want to run Jest testing?');
    // setGitConfig('hooks.skipJestTests', (!runJestTests).toString());
    //
    // // Configure Cypress testing
    // const runCypressTests = await promptYesNo('Do you want to run Cypress testing?');
    // setGitConfig('hooks.skipCypressTests', (!runCypressTests).toString());

    //console.log('\n==================================');
    console.log('\nConfiguration complete.\n');
    //console.log(`- Pre-commit hooks: ${runPreCommit ? 'Enabled' : 'Disabled'}`);
    //console.log(`- ESLint checks: ${runLinting ? 'Enabled' : 'Disabled'}`);
    //console.log(`- Jest testing: ${runJestTests ? 'Enabled' : 'Disabled'}`);
    //console.log(`- Cypress testing: ${runCypressTests ? 'Enabled' : 'Disabled'}`);

    rl.close();
};

// Run the setup
setupHooks().catch(error => {
    console.error('Error during setup:', error);
    process.exit(1);
});