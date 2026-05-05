/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Syne', 'sans-serif'],
      },
      colors: {
        bg: { DEFAULT: '#0a0c10', 2: '#111318', 3: '#181b22', 4: '#1e2028' },
        border: { DEFAULT: '#2a2d38', 2: '#3a3d4a' },
        accent: { DEFAULT: '#4f7cff', 2: '#3d63d4' },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      }
    }
  },
  plugins: [],
}
