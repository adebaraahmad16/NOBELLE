/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#A94A5A',
          'red-dark': '#8E3D4C',
          'red-light': '#D98B97',
          beige: '#F5F0EB',
          'beige-dark': '#E8DDD4',
          cream: '#FAF7F4',
          charcoal: '#2D2D2D',
          gray: '#6B6B6B',
          'gray-light': '#9B9B9B',
          gold: '#C9A96E',
          'gold-light': '#D4BC8E',
          'gold-soft': '#C8A96A',
          white: '#FFFFFF',
          black: '#0a0a0a',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        numeric: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'luxury': '0 8px 32px -4px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.08)',
        'luxury-lg': '0 20px 60px -12px rgba(0,0,0,0.18), 0 8px 24px -4px rgba(0,0,0,0.1)',
        'luxury-red': '0 8px 24px rgba(169,74,90,0.25)',
        'luxury-gold': '0 8px 24px rgba(200,169,106,0.2)',
        'glass': '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover': '0 20px 48px -8px rgba(0,0,0,0.14), 0 0 0 1px rgba(177,18,38,0.08)',
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #B11226 0%, #7a0b19 100%)',
        'gradient-gold': 'linear-gradient(135deg, #C8A96A 0%, #a8843a 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0D0D0D 0%, #160407 50%, #0D0D0D 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'counter-up': 'counterUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'card-lift': 'cardLift 0.25s ease-out forwards',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'slide-in-sidebar': 'slideInSidebar 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'notification-in': 'notificationIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        counterUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        cardLift: {
          '0%': { transform: 'translateY(0)', boxShadow: 'none' },
          '100%': { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-800px 0' },
          '100%': { backgroundPosition: '800px 0' },
        },
        slideInSidebar: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        notificationIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
      backdropBlur: {
        'xs': '4px',
        '2xl': '40px',
      },
    },
  },
  plugins: [],
}
