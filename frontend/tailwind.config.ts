import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // BRAND COLORS (Adverant identity)
        brand: {
          50: '#f0fafd',
          100: '#e0f5fb',
          200: '#c2ebf7',
          300: '#94dcf1',
          400: '#4faeca', // Logo cyan - PRIMARY BRAND COLOR
          500: '#3b9cb8',
          600: '#2d7d96',
          700: '#24647a',
          800: '#1e5165',
          900: '#1b4456',
        },

        // NEUTRAL COLORS (optimized for WCAG AA contrast in light mode)
        neutral: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#16191d',
          950: '#0d1014',
        },

        // ACCENT COLORS (CTAs & highlights)
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // SEMANTIC COLORS
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          700: '#1d4ed8',
        },

        // SURFACE COLORS
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f9fa',
          tertiary: '#f1f3f5',
          dark: {
            DEFAULT: '#0a0a0a',
            secondary: '#1a1a1a',
            tertiary: '#2a2a2a',
          },
        },

        // COINEST COLORS (Dashboard Dark Theme)
        coinest: {
          bg: {
            primary: '#0D0D0D',
            secondary: '#1A1A1A',
            tertiary: '#262626',
          },
          accent: {
            brown: '#8B7355',
            beige: '#D4C4A8',
            cyan: '#4faeca',
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#A3A3A3',
            muted: '#737373',
          },
          border: '#333333',
        },

        // COMPLIANCE-SPECIFIC COLORS
        compliance: {
          // Risk levels
          critical: {
            DEFAULT: '#ef4444',
            light: 'rgba(239, 68, 68, 0.2)',
          },
          high: {
            DEFAULT: '#f97316',
            light: 'rgba(249, 115, 22, 0.2)',
          },
          medium: {
            DEFAULT: '#eab308',
            light: 'rgba(234, 179, 8, 0.2)',
          },
          low: {
            DEFAULT: '#22c55e',
            light: 'rgba(34, 197, 94, 0.2)',
          },
          // EU Trustworthy AI Requirements
          requirement: {
            humanAgency: '#3b82f6',
            robustness: '#22c55e',
            privacy: '#8b5cf6',
            transparency: '#f59e0b',
            fairness: '#ec4899',
            society: '#14b8a6',
            accountability: '#6366f1',
          },
        },
      },

      // TYPOGRAPHY
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        urbanist: ['Urbanist', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['clamp(3.5rem, 7vw, 6rem)', { lineHeight: '1', fontWeight: '900', letterSpacing: '-0.02em' }],
        'display-xl': ['clamp(3rem, 6vw, 5rem)', { lineHeight: '1', fontWeight: '900', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['clamp(1.75rem, 3vw, 2.25rem)', { lineHeight: '1.2', fontWeight: '700' }],
      },

      // SPACING
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // SHADOWS
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'brand': '0 10px 40px 0 rgba(79, 174, 202, 0.15)',
        'accent': '0 10px 40px 0 rgba(37, 99, 235, 0.15)',
      },

      // BORDER RADIUS
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },

      // ANIMATIONS
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config