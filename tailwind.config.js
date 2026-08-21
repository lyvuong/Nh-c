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
        stage: {
          bg: 'var(--color-stage-bg)',
          card: 'var(--color-stage-card)',
          cardHover: 'var(--color-stage-cardHover)',
          border: 'var(--color-stage-border)',
          accent: 'var(--color-stage-accent)',
          text: 'var(--color-stage-text)',
          muted: 'var(--color-stage-muted)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
