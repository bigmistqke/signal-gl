import path from 'path'
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      '@bigmistqke/signal-gl': path.resolve(__dirname, './lib'),
    },
  },
  build: {
    target: 'esnext',
  },
})
