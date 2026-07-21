import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'favicon-redirect',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/favicon.ico') {
            res.writeHead(302, { Location: '/assets/favicon.jpeg' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  preview: {
    port: 5173,
  },
});
