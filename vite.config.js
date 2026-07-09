import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://77.68.55.33",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
