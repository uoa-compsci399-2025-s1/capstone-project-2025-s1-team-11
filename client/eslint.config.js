// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import pluginCypress from 'eslint-plugin-cypress/flat'; // Only import the flat config version
import jest from 'eslint-plugin-jest';

export default [
  { ignores: ['dist'] },

  // Node.js Utilities
  {
    files: [
      '**/docx/**/*.js',      // Your parseDocxDto.js file and related utilities
      '**/dto/**/*.js',       // DTO handling that might use Node APIs
      '**/services/**/*.js',  // Service files that might use Node-like features
      '**/utils/**/*.js'      // Utility files that might need Node.js globals
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },




  // React / Application Code
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
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

  // Jest Unit Tests
  {
    files: ['**/__tests__/**/*.js', '**/__tests__/**/*.jsx', '**/*.test.js', '**/*.test.jsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node, // For `process`, `global`, etc.
      },
    },
    plugins: {
      jest,
    },
  },

  // Cypress Tests - Using the flat config format
  // First add the globals
  {
    files: ['src/testing/e2e/cypress/**/*.js'],
    ...pluginCypress.configs.globals
  },

  // Then add the recommended rules
  {
    files: ['src/testing/e2e/cypress/**/*.js'],
    ...pluginCypress.configs.recommended
  },

  // Override specific rules if needed
  {
    files: ['src/testing/e2e/cypress/**/*.js'],
    rules: {
      'cypress/no-unnecessary-waiting': 'off',
      'no-unused-expressions': 'off' // For chai assertions
    }
  },

  // Test Scripts
  {
    files: ["src/testing/scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-console": "off",
    },
  },
];
