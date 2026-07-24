export default {
  'apps/api/**/*.ts': (files) => [
    `pnpm --dir apps/api exec eslint --fix ${files.join(' ')}`,
    `pnpm --dir apps/api exec prettier --write ${files.join(' ')}`,
  ],
  'apps/web/**/*.{ts,tsx}': (files) => [
    `pnpm --dir apps/web exec eslint --fix ${files.join(' ')}`,
    `pnpm --dir apps/web exec prettier --write ${files.join(' ')}`,
  ],
};
