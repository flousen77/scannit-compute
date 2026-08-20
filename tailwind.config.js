/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          dark: '#050508',
          panel: 'rgba(255, 255, 255, 0.03)',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          muted: '#94a3b8',
          glass: 'rgba(255, 255, 255, 0.08)'
        }
      }
    }
  },
  plugins: [],
};