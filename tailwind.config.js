/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medium-blue': '#145da0',
        'light-blue': '#56a8ff',
        'white': '#ffffff',
        'dark-navy': '#051d40',
        'pale-sky-blue': '#b1d4e0',
      },
      fontFamily: {
        'sans': ['Open Sans', 'sans-serif'],
        'heading': ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}