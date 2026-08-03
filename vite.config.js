import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ── Frontend test suite ──────────────────────────────────────────
  // Vitest reuses this same config, so tests resolve modules and
  // transform JSX/CSS Modules exactly the way the real build does —
  // no second, separately-drifting toolchain to keep in sync.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.{js,jsx}'],
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      // Content and config files are data, not logic — covering them
      // measures nothing except how much text was authored.
      exclude: ['src/data/**', 'src/features/scenario/configs/**', 'src/**/mock*.js'],
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions', 'firebase/app-check'],
        },
      },
    },
  },
})
