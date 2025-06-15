/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        secondary: '#48bb78',
        accent: '#ed8936',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans KR', 'sans-serif'],
      },
      borderRadius: {
        'button': '12px',
        'card': '20px',
        'input': '8px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #667eea, #764ba2)',
      },
    },
  },
  plugins: [],
} 