/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0D4A47',
          50: '#E6F2F1',
          100: '#CCE5E3',
          200: '#99CBC7',
          300: '#66B1AB',
          400: '#33978F',
          500: '#0D4A47',
          600: '#0B3E3B',
          700: '#09322F',
          800: '#072623',
          900: '#051A17',
        },
        gold: {
          DEFAULT: '#C9A84C',
          50: '#FAF5E8',
          100: '#F5EBD1',
          200: '#EBD7A3',
          300: '#E1C375',
          400: '#D7AF47',
          500: '#C9A84C',
          600: '#B89440',
          700: '#977A35',
          800: '#765F29',
          900: '#55451D',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'gradient-teal': 'linear-gradient(135deg, #0D4A47 0%, #1a6b67 100%)',
      },
    },
  },
  plugins: [],
};
