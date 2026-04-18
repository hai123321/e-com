const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export function apiUrl(path: string): string {
  return BASE_URL ? `${BASE_URL}/api/v1${path}` : `/api${path}`
}
