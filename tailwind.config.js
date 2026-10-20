/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        darkBg: '#090D16',
        panelBg: '#111827',
        borderCol: '#1F2937',
        cyanAccent: '#00F5D4',
        amberAccent: '#F59E0B',
        purpleAccent: '#7928CA',
      },
    },
  },
  plugins: [],
};
