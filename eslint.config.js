import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['packages/shared/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['@cv-craft/templates', '@cv-craft/web', '@cv-craft/server', 'react', 'react-dom'] },
      ],
    },
  },
  {
    files: ['packages/templates/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@cv-craft/web', '@cv-craft/server'] }],
    },
  },
];
