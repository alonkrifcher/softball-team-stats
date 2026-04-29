/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        team: {
          DEFAULT: '#4B9CD3',
          light: '#7CB8DD',
          dark: '#2A7AB8',
          deep: '#1A5A8C',
          accent: '#F4B400',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
