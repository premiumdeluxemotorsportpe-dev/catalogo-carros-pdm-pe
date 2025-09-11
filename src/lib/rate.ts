const buckets = new Map<string, { tokens: number; last: number }>()

export function allow(ip: string, ratePerMin = 60) {
  const now = Date.now()
  const refillPerMs = ratePerMin / 60000
  const b = buckets.get(ip) || { tokens: ratePerMin, last: now }
  const delta = now - b.last
  b.tokens = Math.min(ratePerMin, b.tokens + delta * refillPerMs)
  b.last = now
  if (b.tokens < 1) { buckets.set(ip, b); return false }
  b.tokens -= 1
  buckets.set(ip, b)
  return true
}
