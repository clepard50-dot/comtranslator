import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // loadEnv reads .env files, process.env has shell variables (from CI)
    const env = loadEnv(mode, '.', '');
    // Prefer shell env var (CI) over .env file (local dev)
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    
    return {
      base: '/comtranslator/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        target: 'esnext',
      },
      esbuild: {
        target: 'esnext',
      },
      optimizeDeps: {
        esbuildOptions: {
          target: 'esnext',
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
