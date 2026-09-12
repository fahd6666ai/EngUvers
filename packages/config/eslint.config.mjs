// Shared flat ESLint base. Apps spread this into their own
// `eslint.config.mjs` and add framework-specific config on top (e.g.
// `next/core-web-vitals` for apps/web).
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export const baseConfig = tseslint.config(
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
    },
  },
  eslintConfigPrettier,
);

export default baseConfig;
