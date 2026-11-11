import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken } from '@/lib/auth'
import {
  buildMarketplacePostbackUrl,
  ensureMarketplacePostbackConfig,
  sumPublisherEarnings,
} from '@/lib/marketplace-postback'
import { getTrackingDomainOrigin } from '@/lib/tracking'

function resolveAppOrigin(request: Request): string {
  const configured = getTrackingDomainOrigin()
    || (process.env.NEXT_PUBLIC_APP_URL || '').trim()
    || (process.env.APP_URL || '').trim()
  if (configured) {
    try {
      return new URL(configured.includes('://') ? configured : `https://${configured}`).origin
    } catch {
      /* fall through */
    }
  }
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3001'
  return `${proto}://${host}`
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin') || null
  const token = getTokenFromCookie(request.headers.get('cookie') || '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) })
  }
  const user = await getUserFromToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) })
  }

  const appOrigin = resolveAppOrigin(request)

  if (user.role === 'MANAGER') {
    const config = await ensureMarketplacePostbackConfig(user.id)
    return NextResponse.json({
      role: 'MANAGER',
      provider: config.provider,
      isActive: config.isActive,
      token: config.token,
      inboundUrl: buildMarketplacePostbackUrl(appOrigin, config.token),
      mapping: {
        s1: 'publisher_id',
        s2: 'offer_id',
        s3: 'publisher_sub_id_1',
        s4: 'publisher_sub_id_2',
        payout: 'payout_usd',
        amount: 'virtual_currency_offerwall',
        cmpid: 'campaign_id',
        cmpname: 'campaign_name',
        datetime: 'unix_timestamp',
        ip: 'conversion_ip',
        country: 'conversion_country',
      },
    }, { headers: getCorsHeaders(origin) })
  }

  const earnings = await sumPublisherEarnings(user.id)
  return NextResponse.json({
    role: 'PUBLISHER',
    earningsSinceLastInvoice: earnings,
  }, { headers: getCorsHeaders(origin) })
}

export async function PATCH(request: Request) {
  const origin = request.headers.get('origin') || null
  const token = getTokenFromCookie(request.headers.get('cookie') || '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) })
  }
  const user = await getUserFromToken(token)
  if (!user || user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: getCorsHeaders(origin) })
  }

  let body: { isActive?: boolean } = {}
  try {
    body = await request.json() as { isActive?: boolean }
  } catch {
    body = {}
  }

  const { prisma } = await import('@/lib/db/prisma')
  const config = await ensureMarketplacePostbackConfig(user.id)
  const updated = await prisma.postbackConfig.update({
    where: { id: config.id },
    data: {
      isActive: typeof body.isActive === 'boolean' ? body.isActive : config.isActive,
    },
  })

  const appOrigin = resolveAppOrigin(request)
  return NextResponse.json({
    role: 'MANAGER',
    provider: updated.provider,
    isActive: updated.isActive,
    token: updated.token,
    inboundUrl: buildMarketplacePostbackUrl(appOrigin, updated.token),
  }, { headers: getCorsHeaders(origin) })
}
