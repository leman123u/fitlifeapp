/** True when `fetch` failed before an HTTP response (backend down, DNS, CORS preflight, etc.). */
export function isNetworkFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const m = err.message
  return /Failed to fetch|NetworkError|fetch failed|ERR_CONNECTION|Load failed|network request failed/i.test(m)
}
