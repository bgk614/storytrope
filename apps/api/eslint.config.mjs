// @ts-check
import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: ['eslint.config.mjs']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginUnicorn.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // project compiles to CommonJS (no "type": "module" in package.json), which doesn't support top-level await
      'unicorn/prefer-top-level-await': 'off',
      // Prisma (`where: { field: null }`) and passport-jwt's JwtFromRequestFunction type both require literal null
      'unicorn/no-null': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }]
    }
  },
  {
    // `*.e2e-spec.ts` is Nest's standard e2e test naming convention, matched by test/jest-e2e.json's testRegex
    files: ['test/**/*.e2e-spec.ts'],
    rules: {
      'unicorn/prevent-abbreviations': 'off'
    }
  }
)
