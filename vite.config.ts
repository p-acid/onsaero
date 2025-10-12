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
  build: {
    rollupOptions: {
      input: {
        newtab: 'newtab.html'
      }
    }
  }
})
