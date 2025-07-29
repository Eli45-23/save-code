/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // iOS System Colors
        systemBlue: '#007AFF',
        systemGreen: '#34C759',
        systemRed: '#FF3B30',
        systemOrange: '#FF9500',
        systemPurple: '#AF52DE',
        systemYellow: '#FFCC00',
        systemPink: '#FF2D92',
        systemTeal: '#30B0C7',
        systemIndigo: '#5856D6',
        // Neutral Grays (iOS style)
        gray: {
          50: '#F2F2F7',
          100: '#E5E5EA',
          200: '#D1D1D6',
          300: '#C7C7CC',
          400: '#AEAEB2',
          500: '#8E8E93',
          600: '#636366',
          700: '#48484A',
          800: '#3A3A3C',
          900: '#1C1C1E',
        },
        // Background Colors
        background: {
          primary: '#FFFFFF',
          secondary: '#F2F2F7',
          tertiary: '#FFFFFF',
        }
      },
      fontFamily: {
        // iOS System Fonts (fallback to system fonts)
        'sf-pro': ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        'sf-pro-display': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        'sf-mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Consolas', 'monospace'],
      },
      fontSize: {
        // iOS Typography Scale
        'largeTitle': ['34px', { lineHeight: '41px', fontWeight: '700' }],
        'title1': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'title2': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'title3': ['20px', { lineHeight: '25px', fontWeight: '600' }],
        'headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'body': ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'callout': ['16px', { lineHeight: '21px', fontWeight: '400' }],
        'subheadline': ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption1': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'caption2': ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
      spacing: {
        // iOS spacing system
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        // iOS corner radius system
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        // iOS-style shadows
        'ios-sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'ios-md': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'ios-lg': '0 8px 16px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
};