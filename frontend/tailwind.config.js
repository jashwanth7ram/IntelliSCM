/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#111111',
        primary: '#FF4500', // Fiery orange/red
        primaryHover: '#E63E00',
        textMain: '#ffffff',
        textMuted: '#888888',
        border: '#2a2a2a',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        noirtheme: {
          "primary": "#FF4500",
          "primary-focus": "#E63E00",
          "secondary": "#222222",
          "accent": "#ff6b33",
          "neutral": "#111111",
          "base-100": "#050505",
          "base-200": "#111111",
          "base-300": "#1a1a1a",
          "base-content": "#ffffff",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
  },
}
