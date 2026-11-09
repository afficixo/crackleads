export const corsConfig = {
  allowedOrigins: [
    'http://localhost:3000',
    'https://*.vercel.app',
    'https://*.yourdomain.com',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
    'X-Api-Version',
    'Referer',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Total-Pages'],
  credentials: true,
  maxAge: 86400,
}

export function isOriginAllowed(origin: string): boolean {
  // Check exact matches
  if (corsConfig.allowedOrigins.includes(origin)) {
    return true
  }

  // Check wildcard patterns with proper regex escaping
  return corsConfig.allowedOrigins.some(allowed => {
    if (!allowed.includes('*')) return false
    // Escape special regex characters first, then replace * with .*
    const pattern = allowed
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\\\*/g, '.*') // Replace escaped * with .*
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(origin)
  })
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const isAllowed = origin && isOriginAllowed(origin)

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Credentials': String(corsConfig.credentials),
    'Access-Control-Allow-Methods': corsConfig.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
    'Access-Control-Expose-Headers': corsConfig.exposedHeaders.join(', '),
    'Access-Control-Max-Age': String(corsConfig.maxAge),
  }
}