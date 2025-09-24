import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import html from '@html-eslint/eslint-plugin'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import inclusiveLanguage from 'eslint-plugin-inclusive-language'
import { defineConfig } from 'eslint/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  {
    ...html.configs['flat/recommended'],
    files: ['**/*.html', '**/*.ts'],
    rules: {
      ...html.configs['flat/recommended'].rules, // Must be defined. If not, all recommended rules will be lost
      '@html-eslint/indent': ['error', 2],
    },
  },
  {
    ignores: [
      '**/node_modules/',
      '**/*.js',
      '**/dist/',
      'eslint.config.mjs',
      'bun.lock',
      'examples/**/*',
      'packages/lib/actions.ts',
      'packages/lib/formulas.ts',
    ],
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'inclusive-language': inclusiveLanguage,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-confusing-non-null-assertion': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/return-await': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'max-params': ['error', 3],
      'no-return-await': 'off',
      'no-unused-vars': 'off',
      'inclusive-language/use-inclusive-words': [
        'error',
        './lint/inclusive-words.json',
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-console': 'error',
    },
  },
])
