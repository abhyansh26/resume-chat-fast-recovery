// web/src/flags.ts
export const FEATURE_TEMPLATES =
  (import.meta.env.VITE_FEATURE_TEMPLATES ?? "0") === "1";
