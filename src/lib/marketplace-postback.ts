import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/db/prisma'

export function createPostbackToken(): string {
  return randomBytes(24).toString('hex')
}

/**
 * Manager inbound URL using only main-marketplace Affmine tokens:
 * #s1# #s2# #s3# #s4# #payout# #amount# #cmpid# #cmpname# #datetime# #ip# #country#
 *
 * Our tracking map on main offer links:
 *   s1 = publisher id, s2 = offer id, s3 = publisher sub1, s4 = publisher sub2
 */
export function buildMarketplacePostbackUrl(origin: string, token: string): string {
  const base = origin.replace(/\/$/, '')
  return `${base}/api/postback/in/${encodeURIComponent(token)}`
    + '?s1=#s1#&s2=#s2#&s3=#s3#&s4=#s4#'
    + '&payout=#payout#&amount=#amount#'
    + '&cmpid=#cmpid#&cmpname=#cmpname#'
    + '&datetime=#datetime#&ip=#ip#&country=#country#'
}

export async function ensureMarketplacePostbackConfig(managerId: string) {
  let userId = managerId

  // Sessions minted while the DB was empty use `local-{username}` ids that
  // cannot satisfy the postback_configs.userId foreign key.
  if (userId.startsWith('local-')) {
    const { ensureManagerDbUser } = await import('@/lib/manager-auth')
    const manager = await ensureManagerDbUser()
    if (!manager) {
      throw new Error('Manager account is not initialized. Sign out and sign in again.')
    }
    userId = manager.id
  } else {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!user) {
      const { ensureManagerDbUser } = await import('@/lib/manager-auth')
      const manager = await ensureManagerDbUser()
      if (!manager) {
        throw new Error('Manager account is not initialized. Sign out and sign in again.')
      }
      userId = manager.id
    }
  }

  const existing = await prisma.postbackConfig.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: 'MARKETPLACE',
      },
    },
  })
  if (existing) return existing

  try {
    return await prisma.postbackConfig.create({
      data: {
        userId,
        provider: 'MARKETPLACE',
        label: 'Main marketplace inbound',
        token: createPostbackToken(),
        isActive: true,
      },
    })
  } catch (error) {
    console.error('ensureMarketplacePostbackConfig create failed:', error)
    const raced = await prisma.postbackConfig.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'MARKETPLACE',
        },
      },
    })
    if (!raced) {
      throw new Error(
        error instanceof Error
          ? `Unable to create marketplace postback config: ${error.message}`
          : 'Unable to create marketplace postback config',
      )
    }
    return raced
  }
}

function firstParam(params: URLSearchParams, keys: string[]): string {
  for (const key of keys) {
    const value = params.get(key)
    if (value != null && value.trim() && !/^#.*#$/.test(value.trim())) {
      return value.trim()
    }
  }
  return ''
}

function parsePayout(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[^0-9.+-]/g, '')
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function parseOccurredAt(raw: string): Date | null {
  if (!raw) return null
  if (/^\d{9,13}$/.test(raw)) {
    const num = Number(raw)
    const ms = raw.length <= 10 ? num * 1000 : num
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildExternalKey(parts: {
  token: string
  publisherKey: string
  offerKey: string
  payout: string
  datetime: string
  ip: string
  cmpid: string
  s3: string
  s4: string
}) {
  return createHash('sha256')
    .update([
      parts.token,
      parts.publisherKey,
      parts.offerKey,
      parts.payout,
      parts.datetime,
      parts.ip,
      parts.cmpid,
      parts.s3,
      parts.s4,
    ].join('|'))
    .digest('hex')
}

export type IngestPostbackResult =
  | {
      ok: true
      leadId: string
      duplicate?: boolean
      publisherNumber: number
      offerId: string
      payout: number
      publisherPostback?: {
        fired: boolean
        status?: number
        skipped?: string
        url?: string
      }
    }
  | { ok: false; status: number; error: string }

/**
 * Marketplace → our app.
 * Mapping (already used on tracking links):
 *   s1 = publisher id (publisherNumber)
 *   s2 = offer id (CampaignOffer.id)
 *   s3 = publisher sub id 1
 *   s4 = publisher sub id 2
 */
export async function ingestMarketplacePostback(
  token: string,
  params: URLSearchParams,
): Promise<IngestPostbackResult> {
  const config = await prisma.postbackConfig.findFirst({
    where: { token, isActive: true, provider: 'MARKETPLACE' },
  })
  if (!config) {
    return { ok: false, status: 404, error: 'Unknown or inactive postback token' }
  }

  const s1 = firstParam(params, ['s1', 'sub1', 'sub_id_1'])
  const s2 = firstParam(params, ['s2', 'sub2', 'sub_id_2', 'offer_id', 'offerid'])
  let s3 = firstParam(params, ['s3', 'sub3', 'sub_id_3'])
  let s4 = firstParam(params, ['s4', 'sub4', 'sub_id_4'])
  const payoutRaw = firstParam(params, ['payout', 'revenue'])
  const amountRaw = firstParam(params, ['amount'])
  const cmpid = firstParam(params, ['cmpid', 'campaign_id', 'campaignid'])
  const cmpname = firstParam(params, ['cmpname', 'campaign_name', 'campaignname'])
  const datetime = firstParam(params, ['datetime', 'time', 'timestamp'])
  const ip = firstParam(params, ['ip', 'ip_address', 'ipaddress'])
  const country = firstParam(params, ['country', 'geo']).toUpperCase()

  if (!s1 || !s2) {
    return { ok: false, status: 400, error: 'Missing required s1 (publisher id) or s2 (offer id)' }
  }

  const publisherNumber = Number(s1)
  if (!Number.isFinite(publisherNumber) || publisherNumber <= 0) {
    return { ok: false, status: 400, error: 'Invalid publisher id in s1' }
  }

  const publisher = await prisma.user.findFirst({
    where: {
      publisherNumber,
      role: { in: ['PUBLISHER', 'MANAGER'] },
    },
    select: { id: true, publisherNumber: true, status: true },
  })
  if (!publisher || publisher.publisherNumber == null) {
    return { ok: false, status: 404, error: `Publisher #${publisherNumber} not found` }
  }

  const offer = await prisma.campaignOffer.findUnique({
    where: { id: s2 },
    select: { id: true, name: true, payout: true, status: true },
  })
  if (!offer) {
    return { ok: false, status: 404, error: `Offer #${s2} not found` }
  }

  // If marketplace omitted publisher subs, backfill from latest tracking click.
  if (!s3 || !s4) {
    const click = await prisma.offerClick.findFirst({
      where: {
        offerId: offer.id,
        OR: [
          { publisherUserId: publisher.id },
          { publisherNumber },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { sub1: true, sub2: true },
    })
    if (click) {
      if (!s3 && click.sub1) s3 = click.sub1
      if (!s4 && click.sub2) s4 = click.sub2
    }
  }

  const amount = parsePayout(amountRaw)
  const payout = parsePayout(payoutRaw) ?? amount ?? offer.payout
  if (!Number.isFinite(payout) || payout < 0) {
    return { ok: false, status: 400, error: 'Invalid payout' }
  }

  const occurredAt = parseOccurredAt(datetime) ?? new Date()
  const externalKey = buildExternalKey({
    token,
    publisherKey: s1,
    offerKey: s2,
    payout: String(payout),
    datetime: datetime || occurredAt.toISOString(),
    ip,
    cmpid,
    s3,
    s4,
  })

  const existing = await prisma.conversionLead.findUnique({
    where: { externalKey },
    select: { id: true },
  })
  if (existing) {
    return {
      ok: true,
      duplicate: true,
      leadId: existing.id,
      publisherNumber,
      offerId: offer.id,
      payout,
    }
  }

  try {
    const lead = await prisma.conversionLead.create({
      data: {
        userId: publisher.id,
        postbackId: config.id,
        offerId: offer.id,
        campaignId: cmpid || null,
        campaignName: cmpname || offer.name,
        payout,
        country: country || null,
        ipAddress: ip || null,
        status: 'Approved',
        sub1: s1,
        sub2: s2,
        sub3: s3 || null,
        sub4: s4 || null,
        occurredAt,
        externalKey,
      },
      select: {
        id: true,
        offerId: true,
        campaignId: true,
        campaignName: true,
        payout: true,
        country: true,
        ipAddress: true,
        status: true,
        sub3: true,
        sub4: true,
        occurredAt: true,
        createdAt: true,
      },
    })

    // Affmine: credit then fire publisher Global S2S with full conversion tokens.
    let publisherPostback: { fired: boolean; status?: number; skipped?: string; url?: string } | undefined
    try {
      const { firePublisherGlobalPostback } = await import('@/lib/publisher-postback')
      publisherPostback = await firePublisherGlobalPostback(publisher.id, {
        ...lead,
        amount: amount ?? lead.payout,
      })
    } catch (error) {
      console.error('Publisher postback dispatch failed:', error)
      publisherPostback = { fired: false, skipped: 'dispatch_error' }
    }

    return {
      ok: true,
      leadId: lead.id,
      publisherNumber,
      offerId: offer.id,
      payout,
      publisherPostback,
    }
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : ''
    if (code === 'P2002') {
      const raced = await prisma.conversionLead.findUnique({
        where: { externalKey },
        select: { id: true },
      })
      if (raced) {
        return {
          ok: true,
          duplicate: true,
          leadId: raced.id,
          publisherNumber,
          offerId: offer.id,
          payout,
        }
      }
    }
    throw error
  }
}

export async function sumPublisherEarnings(userId: string): Promise<number> {
  const aggregate = await prisma.conversionLead.aggregate({
    where: { userId },
    _sum: { payout: true },
  })
  return Number(aggregate._sum.payout ?? 0)
}
