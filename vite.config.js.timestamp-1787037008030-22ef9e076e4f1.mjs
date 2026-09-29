// vite.config.js
import { defineConfig } from "file:///C:/Users/Cadig/Downloads/SENTRY/SENTRI/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Cadig/Downloads/SENTRY/SENTRI/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  // ── Frontend test suite ──────────────────────────────────────────
  // Vitest reuses this same config, so tests resolve modules and
  // transform JSX/CSS Modules exactly the way the real build does —
  // no second, separately-drifting toolchain to keep in sync.
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.js"],
    include: ["test/**/*.test.{js,jsx}"],
    css: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,jsx}"],
      // Content and config files are data, not logic — covering them
      // measures nothing except how much text was authored.
      exclude: ["src/data/**", "src/features/scenario/configs/**", "src/**/mock*.js"]
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/functions", "firebase/app-check"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxDYWRpZ1xcXFxEb3dubG9hZHNcXFxcU0VOVFJZXFxcXFNFTlRSSVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQ2FkaWdcXFxcRG93bmxvYWRzXFxcXFNFTlRSWVxcXFxTRU5UUklcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0NhZGlnL0Rvd25sb2Fkcy9TRU5UUlkvU0VOVFJJL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuXG4gIC8vIFx1MjUwMFx1MjUwMCBGcm9udGVuZCB0ZXN0IHN1aXRlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAvLyBWaXRlc3QgcmV1c2VzIHRoaXMgc2FtZSBjb25maWcsIHNvIHRlc3RzIHJlc29sdmUgbW9kdWxlcyBhbmRcbiAgLy8gdHJhbnNmb3JtIEpTWC9DU1MgTW9kdWxlcyBleGFjdGx5IHRoZSB3YXkgdGhlIHJlYWwgYnVpbGQgZG9lcyBcdTIwMTRcbiAgLy8gbm8gc2Vjb25kLCBzZXBhcmF0ZWx5LWRyaWZ0aW5nIHRvb2xjaGFpbiB0byBrZWVwIGluIHN5bmMuXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIHNldHVwRmlsZXM6IFsnLi90ZXN0L3NldHVwLmpzJ10sXG4gICAgaW5jbHVkZTogWyd0ZXN0LyoqLyoudGVzdC57anMsanN4fSddLFxuICAgIGNzczogdHJ1ZSxcbiAgICBjb3ZlcmFnZToge1xuICAgICAgcHJvdmlkZXI6ICd2OCcsXG4gICAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLntqcyxqc3h9J10sXG4gICAgICAvLyBDb250ZW50IGFuZCBjb25maWcgZmlsZXMgYXJlIGRhdGEsIG5vdCBsb2dpYyBcdTIwMTQgY292ZXJpbmcgdGhlbVxuICAgICAgLy8gbWVhc3VyZXMgbm90aGluZyBleGNlcHQgaG93IG11Y2ggdGV4dCB3YXMgYXV0aG9yZWQuXG4gICAgICBleGNsdWRlOiBbJ3NyYy9kYXRhLyoqJywgJ3NyYy9mZWF0dXJlcy9zY2VuYXJpby9jb25maWdzLyoqJywgJ3NyYy8qKi9tb2NrKi5qcyddLFxuICAgIH0sXG4gIH0sXG5cbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ3ZlbmRvci1yZWFjdCc6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndmVuZG9yLWZpcmViYXNlJzogWydmaXJlYmFzZS9hcHAnLCAnZmlyZWJhc2UvYXV0aCcsICdmaXJlYmFzZS9maXJlc3RvcmUnLCAnZmlyZWJhc2UvZnVuY3Rpb25zJywgJ2ZpcmViYXNlL2FwcC1jaGVjayddLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1QsU0FBUyxvQkFBb0I7QUFDN1UsT0FBTyxXQUFXO0FBRWxCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTWpCLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFlBQVksQ0FBQyxpQkFBaUI7QUFBQSxJQUM5QixTQUFTLENBQUMseUJBQXlCO0FBQUEsSUFDbkMsS0FBSztBQUFBLElBQ0wsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsU0FBUyxDQUFDLG1CQUFtQjtBQUFBO0FBQUE7QUFBQSxNQUc3QixTQUFTLENBQUMsZUFBZSxvQ0FBb0MsaUJBQWlCO0FBQUEsSUFDaEY7QUFBQSxFQUNGO0FBQUEsRUFFQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDekQsbUJBQW1CLENBQUMsZ0JBQWdCLGlCQUFpQixzQkFBc0Isc0JBQXNCLG9CQUFvQjtBQUFBLFFBQ3ZIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
