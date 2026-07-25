import { env } from './env'
import { EMSError } from './errors'

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${env.apiBaseUrl}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  try {
    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new EMSError(
        errorData.message || 'API request failed',
        errorData.code || 'API_ERROR',
        response.status
      )
    }
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof EMSError) throw error
    throw new EMSError('Network error connecting to EMS server', 'NETWORK_ERROR', 0)
  }
}
