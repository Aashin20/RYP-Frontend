export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export async function apiRequest(url: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    'ngrok-skip-browser-warning': 'true',
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
