import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      minify: 'terser',
      sourcemap: false,
      terserOptions: {
        compress: {
          pure_getters: true,
          unsafe: false,
          unsafe_comps: false,
          passes: 1,
        },
        mangle: {
          safari10: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/recharts')) return 'recharts';
            if (id.includes('node_modules/lucide-react')) return 'icons';
            if (id.includes('node_modules/@mui/icons-material')) return 'mui-icons';
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'recharts',
        'lucide-react',
      ],
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: [
        'localhost',
        '.up.railway.app',
        '.zeabur.app',
        '.railway.app',
      ],
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
