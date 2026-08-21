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
          bg: 'rgb(var(--color-stage-bg) / <alpha-value>)',
          card: 'rgb(var(--color-stage-card) / <alpha-value>)',
          cardHover: 'rgb(var(--color-stage-cardHover) / <alpha-value>)',
          border: 'rgb(var(--color-stage-border) / <alpha-value>)',
          accent: 'rgb(var(--color-stage-accent) / <alpha-value>)',
          text: 'rgb(var(--color-stage-text) / <alpha-value>)',
          muted: 'rgb(var(--color-stage-muted) / <alpha-value>)',
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
