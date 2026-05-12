import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        background: '#F8FAFC',
        foreground: '#0F172A',
        muted: '#475569',
        card: '#FFFFFF',
      },
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
      },
      fontWeight: {
        bold: '700',
        semibold: '600',
      },
    },
  },
  plugins: [],
};

export default config;
