const tokens = require('./src/constants/tokens.json');
const pixels = (values) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, `${value}px`]));
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: { brand: tokens.brand.primary, 'on-brand': tokens.brand.onPrimary, light: tokens.light, dark: tokens.dark },
      spacing: pixels(tokens.spacing),
      borderRadius: pixels(tokens.radius),
    },
  },
  plugins: [],
};
