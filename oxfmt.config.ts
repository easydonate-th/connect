import { defineConfig } from 'oxfmt'
import ultracite from 'ultracite/oxfmt'

export default defineConfig({
  ...ultracite,
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  semi: false,
  arrowParens: 'avoid',
  sortImports: {
    ignoreCase: true,
    newlinesBetween: true,
    groups: [
      ['builtin', 'external'],
      ['internal', 'subpath'],
      ['parent', 'sibling', 'index'],
      'style',
      'unknown',
    ],
  },
  sortPackageJson: true,
  sortTailwindcss: true,
})
