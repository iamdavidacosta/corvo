import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };

  if (mode === 'production') {
    const requiredVariables = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missingVariables = requiredVariables.filter((name) => !env[name]?.trim());

    if (missingVariables.length > 0) {
      throw new Error(`Faltan variables de entorno para producción: ${missingVariables.join(', ')}`);
    }
  }

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
