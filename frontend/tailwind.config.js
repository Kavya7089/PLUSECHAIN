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
        // Strict 60-30-10 System:
        // 60% Main — Abyss Teal
        abyss: {
          canvas: 'var(--color-abyss-canvas)',
          card: 'var(--color-abyss-card)',
          elevated: 'var(--color-abyss-elevated)',
          border: 'var(--color-abyss-border)',
          text: 'var(--color-abyss-text)',
          muted: 'var(--color-abyss-muted)',
        },
        // 30% Secondary — Sand Putty
        sand: {
          base: 'var(--color-sand-base)',
          surface: 'var(--color-sand-surface)',
          border: 'var(--color-sand-border)',
          text: 'var(--color-sand-text)',
          muted: 'var(--color-sand-muted)',
        },
        // 10% Accent — Taxi Volt
        volt: {
          DEFAULT: '#FFD400',
          hover: '#E6BF00',
          text: '#081F20',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
