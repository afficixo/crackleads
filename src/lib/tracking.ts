/** Affmine-style publisher tracking → main offer postback mapping. */

export const DEFAULT_MAIN_OFFER_BASE = 'https://www.af9m8trk.com/6HH112BV/UQ711VGP/'

function normalizeOrigin(value: string | undefined | null): string {
  const raw = (value || '').trim()
  if (!raw) return ''
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return url.origin
  } catch {
    return ''
  }
}

/** Public tracking origin from env (`TRACKING_DOMAIN` / `NEXT_PUBLIC_TRACKING_DOMAIN`). */
export function getTrackingDomainOrigin(): string {
  return normalizeOrigin(
    process.env.NEXT_PUBLIC_TRACKING_DOMAIN
    || process.env.TRACKING_DOMAIN
    || '',
  )
}

export function getTrackingDomainHost(): string {
  const origin = getTrackingDomainOrigin()
  if (!origin) return ''
  try {
    return new URL(origin).host.toLowerCase()
  } catch {
    return ''
  }
}

export function sanitizeTrackingToken(value: string | number | null | undefined): string {
  return String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 100)
}

export type PublicTrackingParts = {
  publisherId: string | number
  offerId: string | number
  subId1?: string
  subId2?: string
}

/** Publisher-facing link: https://tracking-domain/{publisher}/{offer}/?s1=&s2= */
export function buildPublicTrackingUrl(parts: PublicTrackingParts, origin = getTrackingDomainOrigin()): string {
  const publisherId = sanitizeTrackingToken(parts.publisherId)
  const offerId = sanitizeTrackingToken(parts.offerId)
  if (!origin || !publisherId || !offerId) return ''

  // No trailing slash — avoids an extra 308 before the track rewrite.
  const url = new URL(`${origin.replace(/\/$/, '')}/${publisherId}/${offerId}`)
  const sub1 = parts.subId1?.trim()
  const sub2 = parts.subId2?.trim()
  if (sub1) url.searchParams.set('s1', sub1)
  if (sub2) url.searchParams.set('s2', sub2)
  return url.toString()
}

export type MainOfferParts = {
  mainOfferBase: string
  publisherId: string | number
  offerId: string | number
  subId1?: string
  subId2?: string
}

/**
 * Hidden network link used for postbacks:
 * {main}/?s1={publisher_id}&s2={offer_id}&s3={sub1}&s4={sub2}
 */
export function buildMainOfferUrl(parts: MainOfferParts): string {
  const base = (parts.mainOfferBase || DEFAULT_MAIN_OFFER_BASE).trim() || DEFAULT_MAIN_OFFER_BASE
  let url: URL
  try {
    url = new URL(base)
  } catch {
    url = new URL(DEFAULT_MAIN_OFFER_BASE)
  }

  // Keep path/host from the offer's main link; replace query with postback map.
  url.search = ''
  url.searchParams.set('s1', sanitizeTrackingToken(parts.publisherId))
  url.searchParams.set('s2', sanitizeTrackingToken(parts.offerId))
  const sub1 = parts.subId1?.trim()
  const sub2 = parts.subId2?.trim()
  if (sub1) url.searchParams.set('s3', sub1)
  if (sub2) url.searchParams.set('s4', sub2)
  return url.toString()
}

export function isTrackingPath(pathname: string): { publisherId: string; offerId: string } | null {
  const match = pathname.match(/^\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)\/?$/)
  if (!match) return null
  const publisherId = match[1]
  const offerId = match[2]
  // Avoid colliding with known app roots when tracking domain == app domain.
  const reserved = new Set([
    'api', 'dashboard', 'campaigns', 'account', 'payments', 'support', 'login', 'signup',
    'incentive_offers', 'contentlocker', 'offerwall', 'tools', 'locker', 'wall', 'affmine',
    '_next', 'favicon.ico',
  ])
  if (reserved.has(publisherId.toLowerCase())) return null
  return { publisherId, offerId }
}
