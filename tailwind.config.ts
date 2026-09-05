import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canva: '#010409',
        surface: '#0d1117',
        elevated: '#161b22',
        borderline: '#30363d',
        muted: '#8b949e',
        accent: '#58a6ff',
        green: {
          DEFAULT: '#3fb950',
          200: '#26a641',
          400: '#39d353',
          600: '#40c463',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'SFMono-Regular',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        default: '6px',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseBar: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out forwards',
        slideUp: 'slideUp 0.4s cubic-bezier(0.2,0.8,0.2,1) forwards',
        pulseBar: 'pulseBar 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;