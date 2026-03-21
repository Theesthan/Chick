/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#1e293b',
        'surface-hover': '#263348',
        border: '#334155',
        primary: '#2563eb',
        'primary-hover': '#1d4ed8',
        'primary-glow': 'rgba(37,99,235,0.3)',
        muted: '#94a3b8',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'shimmer-gradient':
          'linear-gradient(90deg, #1e293b 0%, #263348 50%, #1e293b 100%)',
      },
    },
  },
  plugins: [],
}
