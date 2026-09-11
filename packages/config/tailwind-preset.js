// Shared Tailwind preset for EngUvers apps.
//
// RTL note: we do NOT ship a physical-property-flipping plugin here.
// Components should use Tailwind's logical-property utilities (`ms-*`,
// `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`) instead of `ml-*`/`mr-*`
// so the same class works in both `dir="rtl"` (ar) and `dir="ltr"` (en)
// without a runtime flip step.
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Arabic-first stack; falls back to a Latin-friendly font for `en`.
        sans: ['"IBM Plex Sans Arabic"', '"Cairo"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
};
