import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken } from '@/lib/auth'
import {
  normalizeCampaignOfferInput,
  toCampaignOfferRecord,
  toPrismaCreateData,
} from '@/lib/campaign-offers'
import { prisma } from '@/lib/db/prisma'

type RouteContext = { params: Promise<{ id: string }> }

async function requireManager(request: Request) {
  const origin = request.headers.get('origin') || null
  const token = getTokenFromCookie(request.headers.get('cookie') || '')
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) }) }
  }
  const user = await getUserFromToken(token)
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) }) }
  }
  if (user.role !== 'MANAGER') {
    return { error: NextResponse.json({ error: 'Only managers can manage offers' }, { status: 403, headers: getCorsHeaders(origin) }) }
  }
  return { user, origin }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireManager(request)
  if ('error' in auth) return auth.error
  const { origin } = auth
  const { id: routeId } = await context.params
  const id = routeId?.trim()
  if (!id) {
    return NextResponse.json({ error: 'Offer id is required' }, { status: 400, headers: getCorsHeaders(origin) })
  }

  try {
    const body = await request.json()
    const existing = await prisma.campaignOffer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404, headers: getCorsHeaders(origin) })
    }

    const partial = normalizeCampaignOfferInput({ ...body, id, name: body?.name ?? existing.name, payout: body?.payout ?? existing.payout, country: body?.country ?? existing.country })
    if (!partial) {
      return NextResponse.json({ error: 'Valid offer details are required' }, { status: 400, headers: getCorsHeaders(origin) })
    }

    const data = toPrismaCreateData({
      ...partial,
      action: partial.action ?? (existing.action as 'Apply' | 'Pending' | 'View'),
      requiresApproval: partial.requiresApproval ?? existing.requiresApproval,
      imageSource: partial.imageSource === undefined ? existing.imageSource : partial.imageSource,
      offerTypes: partial.offerTypes ?? existing.offerTypes,
      category: partial.category === undefined ? existing.category : partial.category,
      device: partial.device ?? existing.device,
      description: partial.description === undefined ? existing.description : partial.description,
      offerLink: partial.offerLink === undefined ? existing.offerLink : partial.offerLink,
      isHot: partial.isHot ?? existing.isHot,
      status: partial.status ?? (existing.status as 'ACTIVE' | 'PAUSED'),
      placement: partial.placement ?? (existing.placement as 'STANDARD' | 'INCENTIVE'),
      incentiveActive: partial.incentiveActive ?? existing.incentiveActive,
      countries: partial.countries ?? existing.countries,
    })

    const row = await prisma.campaignOffer.update({
      where: { id },
      data: {
        name: data.name,
        payout: data.payout,
        country: data.country,
        countries: data.countries,
        action: data.action,
        requiresApproval: data.requiresApproval,
        imageSource: data.imageSource,
        offerTypes: data.offerTypes,
        category: data.category,
        device: data.device,
        description: data.description,
        offerLink: data.offerLink,
        isHot: data.isHot,
        status: data.status,
        placement: data.placement,
        incentiveActive: data.incentiveActive,
      },
    })

    return NextResponse.json({ offer: toCampaignOfferRecord(row) }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Update campaign offer failed:', error)
    return NextResponse.json(
      { error: 'Unable to update campaign offer' },
      { status: 503, headers: getCorsHeaders(origin) },
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireManager(request)
  if ('error' in auth) return auth.error
  const { origin } = auth
  const { id: routeId } = await context.params
  const id = routeId?.trim()
  if (!id) {
    return NextResponse.json({ error: 'Offer id is required' }, { status: 400, headers: getCorsHeaders(origin) })
  }

  try {
    await prisma.campaignOffer.delete({ where: { id } })
    return NextResponse.json({ ok: true }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Delete campaign offer failed:', error)
    return NextResponse.json(
      { error: 'Unable to delete campaign offer' },
      { status: 503, headers: getCorsHeaders(origin) },
    )
  }
}
