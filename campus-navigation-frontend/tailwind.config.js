/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eaf2ff',
          500: '#2563eb',
          600: '#1e4fdc',
          700: '#173fbd'
        },
        dark: {
          900: '#0b0f13',
          800: '#0f1720',
          700: '#111827'
        },
        glass: 'rgba(255,255,255,0.04)'
      },
      boxShadow: {
        'soft-dark': '0 10px 30px rgba(2,6,23,0.6)'
      },
      borderRadius: {
        xl: '12px'
      }
    },
  },
  plugins: [],
}
