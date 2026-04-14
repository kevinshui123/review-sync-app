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
      target: 'es2015',
      minify: 'terser',
      sourcemap: false,
      terserOptions: {
        compress: {
          pure_getters: false,
          unsafe: false,
          unsafe_comps: false,
          passes: 1,
          hoist_vars: false,
          hoist_funs: false,
        },
        mangle: false,
        format: {
          ecma: 2015,
        },
      },
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin/index.html'),
        },
      },
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
