/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Studio dizayn tizimi — qoʻngʻir-oltin tema
        bg: {
          primary:   '#0f0f0f',
          secondary: '#1a1a1a',
          tertiary:  '#242424',
          hover:     '#2e2e2e',
        },
        accent: {
          DEFAULT: '#C8A96E',
          light:   '#E8C98E',
          dark:    '#A8893E',
          muted:   '#3d3020',
        },
        text: {
          primary:   '#f0ede8',
          secondary: '#a09890',
          muted:     '#605850',
        },
        status: {
          success: '#4CAF50',
          error:   '#ef5350',
          warning: '#FFA726',
          info:    '#42A5F5',
        },
      },
      borderRadius: {
        card: '14px',
        btn:  '10px',
        chip: '20px',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'system-ui',
          'Segoe UI', 'sans-serif',
        ],
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'pulse-gold': 'pulseGold 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                        to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.5' } },
      },
    },
  },
  plugins: [],
}
