/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_HUGGINGFACE_API_KEY: string
  readonly VITE_DEEPGRAM_API_KEY: string
  readonly VITE_LIVEKIT_API_KEY: string
  readonly VITE_LIVEKIT_SECRET_KEY: string
  readonly VITE_NVIDIA_NGC_API_KEY: string
  readonly VITE_CONVEX_DEPLOYMENT_URL: string
  readonly VITE_MAPBOX_ACCESS_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}