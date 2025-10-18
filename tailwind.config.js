/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'instrument-serif': ['Instrument Serif', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'app-light': '#f2f2f2',
        'app-dark': '#1a1a1a',
      },
    },
  },
  plugins: [],
}
