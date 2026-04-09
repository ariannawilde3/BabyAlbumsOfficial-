/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF9F6',
        foreground: '#1a1a1a',
        primary: {
          DEFAULT: '#7A8E6F',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#F5F5DC',
          foreground: '#3a3a3a',
        },
        muted: {
          DEFAULT: '#e8e6e0',
          foreground: '#717182',
        },
        accent: {
          DEFAULT: '#e8e6d5',
          foreground: '#3a3a3a',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1a1a1a',
        },
        border: 'rgba(122, 142, 111, 0.2)',
        ring: '#7A8E6F',
      },
      borderRadius: {
        lg: '0.625rem',
        md: 'calc(0.625rem - 2px)',
        sm: 'calc(0.625rem - 4px)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};