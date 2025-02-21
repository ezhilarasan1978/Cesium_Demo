import { defineConfig } from 'vite';
import cesium from "vite-plugin-cesium";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  server: {
    port: 3010,
    allowedHosts: "cesium-demo-1.onrender.com"
  },
  plugins: [cesium()],
});
