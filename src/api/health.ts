import { apiFetch } from './client.ts'

export type HealthResponse = {
  status: string
  service?: string
}

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health')
}
