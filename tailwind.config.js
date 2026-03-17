/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'Fredoka One', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        kidboard: {
          blue: '#1A3C5E',
          accent: '#2E75B6',
          bg: '#0A0A1A',
        },
      },
      animation: {
        'float': 'float 5s ease-in-out infinite',
        'beat-pulse': 'beatPulse 0.5s ease-in-out',
        'glow': 'glow 0.3s ease-out',
        'spring-back': 'springBack 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        beatPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        glow: {
          '0%': { opacity: '0', filter: 'brightness(1)' },
          '100%': { opacity: '1', filter: 'brightness(1.4)' },
        },
        springBack: {
          '0%': { transform: 'scale(2.5)' },
          '60%': { transform: 'scale(0.95)' },
          '80%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
