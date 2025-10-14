import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx } from '@crxjs/vite-plugin'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import manifest from './src/manifest.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    vanillaExtractPlugin()
  ],
  // Use relative paths for Chrome Extension compatibility
  base: './',
  build: {
    rollupOptions: {
      input: {
        newtab: 'newtab.html'
      },
      output: {
        // Manual chunk splitting for optimal bundle size
        manualChunks: (id) => {
          // Don't chunk service worker - it needs all dependencies inline
          if (id.includes('service-worker')) {
            return undefined
          }

          // Vendor chunks
          if (id.includes('node_modules')) {
            // Recharts - lazy loaded, separate chunk
            if (id.includes('recharts')) {
              return 'recharts'
            }
            // React core (NOT in service worker)
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase'
            }
            // TanStack Query
            if (id.includes('@tanstack')) {
              return 'tanstack'
            }
            // Other vendors
            return 'vendor'
          }

          // Dashboard components - lazy loaded
          if (id.includes('/components/dashboard/')) {
            return 'dashboard'
          }
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Minification settings
    minify: 'esbuild', // Use esbuild for faster builds
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'zustand', '@tanstack/react-query'],
    exclude: ['recharts'] // Lazy load recharts
  }
})
