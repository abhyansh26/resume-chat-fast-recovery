/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_FEATURE_TEMPLATES?: string;
  readonly VITE_SHOW_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
