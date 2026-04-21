/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          700: '#1a2b4a',
          800: '#132040',
          900: '#0d1530',
        }
      }
    },
  },
  plugins: [],
  safelist: [
    'bg-navy-800',
    'bg-navy-900',
    'text-navy-800',
    'border-navy-800',
    'from-navy-800',
    'to-navy-900',
  ]
}
