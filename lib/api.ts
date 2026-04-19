const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export function apiUrl(path: string): string {
  return BASE_URL ? `${BASE_URL}/api/v1${path}` : `/api${path}`
}

/**
 * Appends a cache-bust param to local logo URLs so browsers discard stale
 * 302 redirects that were previously cached pointing to the defunct
 * Clearbit CDN.  Bump the version number whenever logos change en-masse.
 */
export function logoUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('/api/logos/') && !url.includes('?')) {
    return `${url}?v=2`
  }
  return url
}
