import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      VITE_MAPBOX_ACCESS_TOKEN: JSON.stringify(process.env.MAPBOX_ACCESS_TOKEN),
      VITE_CONVEX_DEPLOYMENT_URL: JSON.stringify(process.env.CONVEX_DEPLOYMENT_URL),
      VITE_DEEPGRAM_API_KEY: JSON.stringify(process.env.DEEPGRAM_API_KEY),
      VITE_LIVEKIT_API_KEY: JSON.stringify(process.env.LIVEKIT_API_KEY),
      VITE_LIVEKIT_SECRET_KEY: JSON.stringify(process.env.LIVEKIT_SECRET_KEY),
      VITE_NVIDIA_NGC_API_KEY: JSON.stringify(process.env.NVIDIA_NGC_API_KEY),
      VITE_OPENAI_API_KEY: JSON.stringify(process.env.OPENAI_API_KEY),
      VITE_HUGGINGFACE_API_KEY: JSON.stringify(process.env.HUGGINGFACE_API_KEY),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV)
    }
  },
  server: {
    port: 3000,
    host: true
  }
});