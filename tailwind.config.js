/** @type {import('tailwindcss').Config} */
export default {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf9',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#00c290', // Mint Logo Accent
          600: '#00a379',
          700: '#008262',
          800: '#00644d',
          900: '#005266', // Deep Ocean Teal (Paleta)
          950: '#2a0057', // Deep Midnight Plum (Paleta)
          periwinkle: '#aaaaff', // Periwinkle (Paleta)
          teal: '#005266',       // Teal (Paleta)
          mint: '#00c290',       // Mint (Paleta)
          lime: '#a8ffa1',       // Spring Lime (Paleta)
          plum: '#2a0057',       // Midnight Plum (Paleta)
        },
        surface: {
          base: '#ffffff',
          subtle: '#f8fafc',
          muted: '#f1f5f9',
          border: '#e2e8f0',
        }
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'medium': '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
        'elevation': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
      },
      maxWidth: {
        'prose-tight': '65ch',
      }
    },
  },
  plugins: [],
}

