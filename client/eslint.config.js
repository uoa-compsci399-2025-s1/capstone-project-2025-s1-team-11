import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import cypress from 'eslint-plugin-cypress';
import jest from 'eslint-plugin-jest';

export default [
  { ignores: ['dist'] },

  // Base JS/React setup
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // Jest test files
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node, // Needed for `global`, `process`, etc.
      },
    },
    plugins: {
      jest,
    },
    rules: {
      // Add any jest-specific rules here if needed
    },
  },

  // Cypress tests
  {
    files: ['cypress/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.commonjs,
        ...globals['shared-node-browser'],
        ...globals.es2021,
        ...globals.worker,
        ...globals.serviceworker,
        ...globals.webextensions,
        ...globals.webworkers,
        ...globals.worker,
        ...globals.es2020,
        ...globals.es2017,
        ...globals.es2016,
        ...globals.es2015,
        ...globals.es6,
        ...globals.es5,
        ...globals.es3,
        ...globals.es2022,
        ...globals.esnext,
        ...globals.cypress,
      },
    },
    plugins: {
      cypress,
    },
    rules: {
      // Add cypress-specific rules here if desired
    },
  },
];