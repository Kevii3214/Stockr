/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '375px', // iPhone SE, small phones
        'sm': '390px', // iPhone 12/13/14 Pro
        'md': '430px', // iPhone 14 Pro Max, Galaxy S23
        'lg': '768px', // Tablets and larger
      },
    },
  },
  plugins: [],
}
