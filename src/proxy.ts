import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCookieValue } from '@/lib/utils/helpers'
import { getTrackingDomainHost, isSharedTrackingAppHost, isTrackingPath } from '@/lib/tracking'

/**
 * Auth gate + publisher tracking rewrites.
 * Tracking public links: /{publisherId}/{offerId}/ → /api/track/...
 * (main offer stays hidden; postback map s1=publisher, s2=offer, s3=sub1, s4=sub2)
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  const trackingParts = isTrackingPath(path)
  if (trackingParts) {
    const trackingHost = getTrackingDomainHost()
    const requestHost = request.headers.get('host')?.toLowerCase() || ''
    const onTrackingHost = Boolean(trackingHost) && (
      requestHost === trackingHost
      || requestHost.startsWith(`${trackingHost}:`)
      || requestHost.split(':')[0] === trackingHost.split(':')[0]
    )
    const publisherLooksLikeId = /^[0-9]+$/.test(trackingParts.publisherId)
    const sharedHost = isSharedTrackingAppHost(requestHost)

    // Shared app+tracking host (local/dev): only numeric /{publisher}/{offer}/.
    // Dedicated tracking host: any non-reserved /{publisher}/{offer}/.
    const shouldRewrite = publisherLooksLikeId || (onTrackingHost && !sharedHost)
    if (shouldRewrite) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = `/api/track/${encodeURIComponent(trackingParts.publisherId)}/${encodeURIComponent(trackingParts.offerId)}`
      return NextResponse.rewrite(rewriteUrl)
    }
  }

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
