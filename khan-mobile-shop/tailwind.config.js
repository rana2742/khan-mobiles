/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#FAF9F7',
          800: '#FFFFFF',
          700: '#E2E8F0',
        },
        accent: '#3B82F6',
        'accent-orange': '#F97316',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.5rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(59, 130, 246, 0.25)',
        card: '0 4px 24px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
