import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

// Next's own `next/typescript` preset already registers the
// `@typescript-eslint` plugin — spreading our shared `@enguvers/config`
// tseslint base on top would redefine that plugin and error. Web relies
// on eslint-config-next alone; apps/api (no Next preset) uses the shared
// base directly.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default config;
