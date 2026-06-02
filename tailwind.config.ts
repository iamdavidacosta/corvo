import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#080A0C',
        surface: '#121518',
        surfaceElevated: '#191D22',
        border: 'rgba(91, 105, 120, 0.28)',
        textPrimary: '#F8FAFC',
        textSecondary: '#CBD5E1',
        textMuted: '#94A3B8',
        accent: '#00E5FF',
        accentHover: '#00B8CC',
        success: '#37D67A',
        warning: '#FBBF24',
        danger: '#F87171',
        dangerSurface: 'rgba(127, 29, 29, 0.28)',
        midnight: '#080A0C',
        panel: '#121518',
        panelSoft: '#191D22',
        electric: '#00E5FF',
        cobalt: '#00B8CC',
        deepBlue: '#252B32',
        textMain: '#F8FAFC',
        borderBlue: 'rgba(91, 105, 120, 0.28)',
      },
      boxShadow: {
        glow: '0 18px 45px rgba(0, 0, 0, 0.28)',
        button: '0 12px 24px rgba(0, 229, 255, 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
