interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // 필요에 따라 추가
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
