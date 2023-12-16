/** @type {import('tailwindcss').Config} */
export default {
  content: ['./options.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      minWidth: theme => ({
        ...theme('spacing'),
      }),
    },
  },
  plugins: [],
};
