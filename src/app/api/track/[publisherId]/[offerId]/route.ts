import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  DEFAULT_MAIN_OFFER_BASE,
  buildMainOfferUrl,
  sanitizeTrackingToken,
} from '@/lib/tracking'

type RouteContext = {
  params: Promise<{ publisherId: string; offerId: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { publisherId: rawPublisherId, offerId: rawOfferId } = await context.params
  const publisherId = sanitizeTrackingToken(rawPublisherId)
  const offerId = sanitizeTrackingToken(rawOfferId)

  if (!publisherId || !offerId) {
    return NextResponse.json({ error: 'Invalid tracking link' }, { status: 400 })
  }

  const requestUrl = new URL(request.url)
  const subId1 = requestUrl.searchParams.get('s1') || ''
  const subId2 = requestUrl.searchParams.get('s2') || ''

  let mainOfferBase = DEFAULT_MAIN_OFFER_BASE
  try {
    const offer = await prisma.campaignOffer.findUnique({
      where: { id: offerId },
      select: { offerLink: true, status: true },
    })
    if (offer?.offerLink?.trim()) {
      mainOfferBase = offer.offerLink.trim()
    }
    if (offer?.status === 'PAUSED') {
      return NextResponse.json({ error: 'Offer is paused' }, { status: 410 })
    }
  } catch {
    // Fall back to default main offer base if DB is unavailable.
  }

  const destination = buildMainOfferUrl({
    mainOfferBase,
    publisherId,
    offerId,
    subId1,
    subId2,
  })

  return NextResponse.redirect(destination, 302)
}
