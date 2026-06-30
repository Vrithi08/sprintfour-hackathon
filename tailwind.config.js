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
        background: {
          light: '#FAFAF9',
          dark: '#0F172A',
        },
        primary: {
          DEFAULT: '#0D9488', // deep teal
          light: '#14B8A6',
          dark: '#0F766E',
        },
        charcoal: {
          DEFAULT: '#1E293B',
          light: '#334155',
          dark: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
