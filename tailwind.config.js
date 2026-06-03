/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bakery: {
          50: '#fdfbf7',
          100: '#fbf5ed',
          200: '#f5e6d3',
          300: '#edd2b3',
          400: '#e1b382',
          500: '#d29054', // Wheat Gold
          600: '#c2763c', // Warm Crust
          700: '#a35728', // Baked Sienna
          800: '#7c3f1d', // Oven Amber
          900: '#4e230e', // Charcoal Sourdough
          950: '#2d1105',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
