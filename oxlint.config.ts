import { defineConfig } from 'oxlint'
import antiSlop from 'ultracite/oxlint/anti-slop'
import core from 'ultracite/oxlint/core'
import react from 'ultracite/oxlint/react'
import tanstack from 'ultracite/oxlint/tanstack'
import vitest from 'ultracite/oxlint/vitest'

export default defineConfig({
  extends: [core, vitest, react, tanstack, antiSlop],
  ignorePatterns: [
    ...core.ignorePatterns,
    '**/.cottontail-tmp/**',
    // shadcn/ui components are generated vendor code
    '**/components/ui/**',
  ],
  rules: {
    'unicorn/error-message': 'off',
    'class-methods-use-this': 'off',
    'typescript/no-extraneous-class': 'off',
    'typescript/parameter-properties': 'off',
    'typescript/consistent-type-imports': 'off',
    'typescript/consistent-type-definitions': 'off',
    'unicorn/filename-case': 'off',
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'unicorn/empty-brace-spaces': 'off',
    'arrow-body-style': 'off',
    'no-await-in-loop': 'off',
    'no-warning-comments': 'off',
    'no-nested-ternary': 'off',
    'react/jsx-pascal-case': 'off',
    complexity: 'off',
  },
})
