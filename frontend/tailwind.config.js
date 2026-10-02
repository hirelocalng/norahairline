/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#6E1A3C',
          50: '#F5EFF1',
          100: '#E5D6DC',
          200: '#CBADB9',
          300: '#AE7F92',
          400: '#8E4C67',
          500: '#6E1A3C',
          600: '#611735',
          700: '#53142D',
          800: '#421024',
          900: '#310C1B',
        },
        gold: {
          DEFAULT: '#C9A96E',
          50: '#FBF9F5',
          100: '#F5F0E5',
          200: '#ECE0CB',
          300: '#E1CFAE',
          400: '#D5BC8E',
          500: '#C9A96E',
          600: '#B19561',
          700: '#977F53',
          800: '#796542',
          900: '#5A4C31',
        },
        cream: '#F4E8D7',
        ivory: '#FAF7F2',
      },
      // Every text-* utility reads from the type scale in src/index.css
      // (:root --fs-*), so site-wide text size is tuned in one place.
      fontSize: {
        xs: ['var(--fs-xs)', { lineHeight: '1.45' }],
        sm: ['var(--fs-sm)', { lineHeight: '1.5' }],
        base: ['var(--fs-base)', { lineHeight: '1.6' }],
        lg: ['var(--fs-lg)', { lineHeight: '1.55' }],
        xl: ['var(--fs-xl)', { lineHeight: '1.45' }],
        '2xl': ['var(--fs-2xl)', { lineHeight: '1.3' }],
        '3xl': ['var(--fs-3xl)', { lineHeight: '1.2' }],
        '4xl': ['var(--fs-4xl)', { lineHeight: '1.15' }],
        '5xl': ['var(--fs-5xl)', { lineHeight: '1.1' }],
        '6xl': ['var(--fs-6xl)', { lineHeight: '1.05' }],
        '7xl': ['var(--fs-7xl)', { lineHeight: '1.05' }],
        '8xl': ['var(--fs-8xl)', { lineHeight: '1' }],
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'gradient-burgundy': 'linear-gradient(135deg, #53142D 0%, #6E1A3C 100%)',
      },
    },
  },
  plugins: [],
};
