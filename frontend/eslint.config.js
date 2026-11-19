import babelParser from '@babel/eslint-parser'
import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

const typescriptSyntax = [
  '@babel/plugin-syntax-typescript',
  { allExtensions: true, isTSX: true },
]

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          plugins: ['@babel/plugin-syntax-jsx', typescriptSyntax],
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      ...reactHooks.configs.flat.recommended.plugins,
      ...jsxA11y.flatConfigs.recommended.plugins,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      complexity: ['error', 15],
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
]
