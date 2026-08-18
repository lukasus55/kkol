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
        'bg-100': 'var(--color-bg-100)',
        'bg-200': 'var(--color-bg-200)',
        'bg-300': 'var(--color-bg-300)',
        'bg-400': 'var(--color-bg-400)',
        'bg-500': 'var(--color-bg-500)',
        'bg-600': 'var(--color-bg-600)',
        'text-900': 'var(--color-text-900)',
        'text-700': 'var(--color-text-700)',
        'text-500': 'var(--color-text-500)',
        'accent-500': 'var(--color-accent-500)',
        'accent-600': 'var(--color-accent-600)',
        'danger-500': 'var(--color-danger-500)',
        'danger-600': 'var(--color-danger-600)',
      },
        fontFamily: {
        sans: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
      },
      keyframes: {
        'toast-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}

export default config
