import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import {
  LEGACY_AFFMINE_DEMO_OFFER_IDS,
  purgeLegacyAffmineDemoOffers,
  toCampaignOfferRecord,
} from '@/lib/campaign-offers'
import { prisma } from '@/lib/db/prisma'

/** Public catalog for Content Locker / OfferWall embeds (no auth). */
export async function GET(request: Request) {
  const origin = request.headers.get('origin') || null
  const url = new URL(request.url)
  const placement = url.searchParams.get('placement')
  const placementFilter = placement === 'INCENTIVE' || placement === 'STANDARD' ? placement : 'INCENTIVE'

  try {
    await purgeLegacyAffmineDemoOffers(prisma)

    const offers = await prisma.campaignOffer.findMany({
      where: {
        placement: placementFilter,
        status: 'ACTIVE',
        ...(placementFilter === 'INCENTIVE' ? { incentiveActive: true } : {}),
        id: { notIn: [...LEGACY_AFFMINE_DEMO_OFFER_IDS] },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 500,
    })

    return NextResponse.json(
      { offers: offers.map(toCampaignOfferRecord) },
      { headers: getCorsHeaders(origin) },
    )
  } catch (error) {
    console.error('Public campaign offers failed:', error)
    return NextResponse.json(
      { error: 'Unable to load offers' },
      { status: 503, headers: getCorsHeaders(origin) },
    )
  }
}
