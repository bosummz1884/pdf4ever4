import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import pages from 'vite-plugin-pages';
import fs from 'fs';

export default defineConfig({
  root: '.',
  publicDir: 'public',

  plugins: [
    react(),
    pages(),
   
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@src': path.resolve(__dirname, 'src'),
      "@types": path.resolve(__dirname, "src/types"),
      '@public': path.resolve(__dirname, 'public'),
      '@components': path.resolve(__dirname, 'components'),
      '@ALLFUNCTIONFILES': path.resolve(__dirname, 'ALLFUNCTIONFILES'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@attached_assets': path.resolve(__dirname, 'src/attached_assets'),
      '@ui': path.resolve(__dirname, 'components/ui'),
      '@hooks': path.resolve(__dirname, "src/hooks"),
      '@lib': path.resolve(__dirname, "src/lib"),
    }
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          pdf: ['pdf-lib', 'pdfjs-dist'],
          util: ['opentype.js', 'file-saver', 'blob-stream']
        }
      }
    },
    target: "esnext",
    minify: "esbuild",
    emptyOutDir: true,
  },

  server: {
    host: '127.0.0.1',
    port: 5173,
    open: true
  },

  preview: {
    port: 4173,
    open: true
  }
});
