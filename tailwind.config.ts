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
        'lime-moss': 'var(--color-accent-500)',
        'charcoal-blue': 'var(--color-bg-200)',
        'lavender-mist': 'var(--color-text-900)',
        'onyx': 'var(--color-bg-100)',
        'dashboard-bg': 'var(--color-bg-100)',
        'dashboard-bg-s2': 'var(--color-bg-200)',
        'dashboard-bg-s3': 'var(--color-bg-300)',
        'dashboard-bg-s4': 'var(--color-bg-400)',
        'dashboard-bg-s5': 'var(--color-bg-500)',
        'dashboard-bg-s6': 'var(--color-bg-600)',
        'dashboard-stroke': 'var(--color-bg-400)',
        'dashboard-text': 'var(--color-text-900)',
        'dashboard-text-s2': 'var(--color-text-700)',
        'dashboard-text-s3': 'var(--color-text-500)',
        'dashboard-primary': 'var(--color-accent-500)',
        'dashboard-primary-hover': 'var(--color-accent-600)',
        'dashboard-danger': 'var(--color-danger-500)',
        'dashboard-danger-hover': 'var(--color-danger-600)',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
