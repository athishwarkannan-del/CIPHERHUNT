/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#07090e',
          card: '#0f131a',
          border: '#1b2330',
          primary: '#10b981', // Emerald green primary accent
          secondary: '#3b82f6', // Cyber blue
          warning: '#f59e0b', // Warning amber
          danger: '#ef4444', // Alert red
          info: '#8b5cf6', // Purple info
          text: '#e2e8f0',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
