/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card':      '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        'card-lg':   '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        'glow':      '0 0 0 4px rgba(99,102,241,0.25)',
        'glow-lg':   '0 8px 32px rgba(99,102,241,0.3)',
        'inset-sm':  'inset 0 2px 4px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-hero':    'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        'gradient-surface': 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fadeIn 0.3s ease both',
        'slide-in':   'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0.35)' },
          '50%':      { boxShadow: '0 0 0 8px transparent' },
        },
      },
    },
  },
  plugins: [],
}