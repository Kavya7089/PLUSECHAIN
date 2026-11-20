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
        palette: {
          charcoal: '#2c2e35',
          teal: '#2a3f3f',
          forest: '#467750',
          mint: '#89c07e',
          mist: '#e0e8e2',
          gold: '#f0cd6e',
        },
        pulse: {
          50: '#f7faf7',
          100: '#e0e8e2',
          200: '#c5d8c8',
          300: '#89c07e',
          400: '#5e9f68',
          500: '#467750',
          600: '#345b3c',
          700: '#2a3f3f',
          800: '#2c2e35',
          900: '#1e2025',
          950: '#14161a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
