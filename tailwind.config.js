/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        'instrument-serif': ['Instrument Serif', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'light': '#f2f2f2',
        'dark': '#1a1a1a',
      },
    },
  },
  plugins: [],
}
