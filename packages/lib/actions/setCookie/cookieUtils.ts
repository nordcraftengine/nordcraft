export type CookieOptions = {
  name: string
  value: string
  sameSite: string
  path: string
  includeSubdomains: boolean
  ttl?: number
}

export const validateCookieArgs = (
  [name, value, ttl, _sameSite, _path, _includeSubdomains]: unknown[],
  onError: (message: string) => void,
): CookieOptions | null => {
  if (typeof name !== 'string') {
    onError('The "Name" argument must be a string')
    return null
  }
  if (typeof value !== 'string') {
    onError('The "Value" argument must be a string')
    return null
  }
  const sameSite = _sameSite ?? 'Lax'
  if (
    typeof sameSite !== 'string' ||
    !['lax', 'strict', 'none'].includes(sameSite.toLocaleLowerCase())
  ) {
    onError('The "SameSite" argument must be "Lax", "Strict" or "None"')
    return null
  }
  const path = _path ?? '/'
  if (typeof path !== 'string' || !path.startsWith('/')) {
    onError('The "Path" argument must be a string and start with /')
    return null
  }
  if (
    ttl !== undefined &&
    ttl !== null &&
    (typeof ttl !== 'number' || isNaN(ttl))
  ) {
    onError('The "Expires in" argument must be a number')
    return null
  }
  const includeSubdomains = _includeSubdomains ?? true
  if (typeof includeSubdomains !== 'boolean') {
    onError('The "Include Subdomains" argument must be a boolean')
    return null
  }
  return {
    name,
    value,
    sameSite: String(sameSite),
    path,
    includeSubdomains,
    ttl: typeof ttl === 'number' ? ttl : undefined,
  }
}
