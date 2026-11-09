import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCookieValue } from '@/lib/utils/helpers'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPage = path === '/' || path === '/login' || path === '/signup'
  const isApiRoute = path.startsWith('/api/')
  if (!isPublicPage && !isApiRoute && !getCookieValue(request.headers.get('cookie') || '', 'auth-token')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except:
    // - _next internals (static, image optimization)
    // - Static files and assets (all common file extensions)
    '/((?!_next|favicon|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|ico|svg|webp|css|js|json|woff|woff2|ttf|eot|txt|xml|map)).*)',
  ],
}