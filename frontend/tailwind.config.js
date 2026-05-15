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
          DEFAULT: '#7A0F3D',
          50: '#F9EEF3',
          100: '#F0D0DC',
          200: '#E0A2B9',
          300: '#C87496',
          400: '#A84570',
          500: '#7A0F3D',
          600: '#6B0D35',
          700: '#5A0A2C',
          800: '#480823',
          900: '#36061A',
        },
        gold: {
          DEFAULT: '#D4B06A',
          50: '#FBF5E8',
          100: '#F5E8CC',
          200: '#ECD4A0',
          300: '#E3C074',
          400: '#DABC62',
          500: '#D4B06A',
          600: '#B89458',
          700: '#9B7A46',
          800: '#7D6034',
          900: '#5F4622',
        },
        cream: '#F4E8D7',
        ivory: '#FAF7F2',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'gradient-burgundy': 'linear-gradient(135deg, #5A0A2C 0%, #7A0F3D 100%)',
      },
    },
  },
  plugins: [],
};
