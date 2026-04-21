/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange:  '#F15A24',
          black:   '#0A0A0A',
          dark:    '#2E2E2E',
          mid:     '#6E6E6E',
          silver:  '#BFBFBF',
        },
      },
    },
  },
  plugins: [],
};
