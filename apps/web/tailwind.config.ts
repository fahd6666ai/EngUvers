import type { Config } from 'tailwindcss';
import sharedPreset from '@enguvers/config/tailwind-preset';

const config: Config = {
  presets: [sharedPreset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
