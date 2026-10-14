// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGETS = {
  local: "http://localhost:3001/api",
  online: "https://form-filler-ppst.onrender.com/api",
};

export default defineConfig(({ mode }) => {
  const apiUrl = API_TARGETS[mode] || API_TARGETS.local;
  const apiOrigin = apiUrl.replace(/\/api\/?$/, "");

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
    },
    server: {
      port: 5173,
      host: true,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: apiOrigin,
          changeOrigin: true,
        },
        "/uploads": {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
    },
  };
});
