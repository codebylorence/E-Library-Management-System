import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor":     ["react", "react-dom", "react-router-dom"],
          "ui-vendor":        ["lucide-react", "framer-motion", "recharts"],
          "calendar-vendor":  ["@fullcalendar/react", "@fullcalendar/daygrid", "@fullcalendar/timegrid", "@fullcalendar/list", "@fullcalendar/interaction"],
          "qr-vendor":        ["html5-qrcode", "qrcode"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
