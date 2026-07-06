import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El target del proxy se configura por env var para que funcione en:
//   • Local nativo:  VITE_DEV_BACKEND no seteada → 'http://localhost:4000'
//   • Docker:        VITE_DEV_BACKEND='http://api:4000' (hostname del servicio)
//   • Otro host:     VITE_DEV_BACKEND='http://192.168.x.y:4000'
const BACKEND_TARGET = process.env.VITE_DEV_BACKEND || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,                    // escucha 0.0.0.0 — necesario en Docker
    proxy: {
      '/api': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
    },
  },
});

