import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lime-moss': '#72B01D',
        'charcoal-blue': '#222429',
        'lavender-mist': '#E0E1E9',
        'onyx': '#0F1115',
        'dashboard-bg': 'var(--dashboard-background)',
        'dashboard-bg-s2': 'var(--dashboard-background-s2)',
        'dashboard-bg-s3': 'var(--dashboard-background-s3)',
        'dashboard-bg-s4': 'var(--dashboard-background-s4)',
        'dashboard-bg-s5': 'var(--dashboard-background-s5)',
        'dashboard-bg-s6': 'var(--dashboard-background-s6)',
        'dashboard-stroke': 'var(--dashboard-stroke)',
        'dashboard-text': 'var(--dashboard-text)',
        'dashboard-text-s2': 'var(--dashboard-text-s2)',
        'dashboard-text-s3': 'var(--dashboard-text-s3)',
        'dashboard-primary': 'var(--color-lime-moss)',
        'dashboard-primary-hover': '#5c9016',
        'dashboard-danger': '#a01010',
        'dashboard-danger-hover': '#800000',
      },
      fontFamily: {
        sans: ['var(--font-lexend)', 'Lexend', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
