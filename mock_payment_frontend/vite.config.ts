import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local development the frontend calls /adk, and Vite forwards that
// to the ADK API server. Start the agent backend on port 8080.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/adk': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adk/, ''),
      },
    },
  },
});
