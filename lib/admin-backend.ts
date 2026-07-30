export type AdminBackendMode = 'local_preview' | 'supabase'

export function getAdminBackendMode(): AdminBackendMode {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return 'supabase'
  }
  return 'local_preview'
}

export function getAdminBackendLabel() {
  return getAdminBackendMode() === 'supabase' ? 'Supabase connected' : 'Local preview mode'
}
