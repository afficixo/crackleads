import { prisma } from '@/lib/db/prisma'
export { PUBLISHER_POSTBACK_URL_EXAMPLE } from '@/lib/postback-tokens'

export type PublisherPostbackLead = {
  offerId?: string | null
  campaignId?: string | null
  campaignName?: string | null
  payout?: number | null
  /** Offerwall virtual currency; falls back to payout when omitted. */
  amount?: number | null
  country?: string | null
  ipAddress?: string | null
  status?: string | null
  /** Publisher tracking sub1 (marketplace inbound s3 / OfferClick.sub1). */
  sub3?: string | null
  /** Publisher tracking sub2 (marketplace inbound s4 / OfferClick.sub2). */
  sub4?: string | null
  /** Optional extra publisher subs (Affmine #s3# / #s4#). */
  publisherSub3?: string | null
  publisherSub4?: string | null
  occurredAt?: Date | null
  createdAt: Date
}

export type PublisherPostbackFireResult = {
  fired: boolean
  status?: number
  url?: string
  skipped?: string
  error?: string
}

function tokenValue(raw: string): string {
  // Encode so real campaign names / subs stay valid in query strings.
  return encodeURIComponent(raw)
}

function statusCode(status?: string | null): string {
  const value = (status || '').trim().toLowerCase()
  if (!value || value === 'approved' || value === '1' || value === 'ok') return '1'
  if (value === 'rejected' || value === '0' || value === 'declined') return '0'
  if (value === 'pending') return '2'
  return '1'
}

/** Affmine-style token replace for publisher Global S2S postback. */
export function buildPublisherPostbackUrl(template: string, lead: PublisherPostbackLead): string {
  const occurred = lead.occurredAt || lead.createdAt
  const unix = Math.floor(occurred.getTime() / 1000)
  const payout = String(Number(lead.payout ?? 0))
  const amount = String(Number(lead.amount ?? lead.payout ?? 0))
  const campaignId = String(lead.offerId || lead.campaignId || '')
  const campaignName = String(lead.campaignName || '')
  const country = String(lead.country || '')
  const ip = String(lead.ipAddress || '')
  const sub1 = String(lead.sub3 || '')
  const sub2 = String(lead.sub4 || '')
  const sub3 = String(lead.publisherSub3 || '')
  const sub4 = String(lead.publisherSub4 || '')
  const status = statusCode(lead.status)

  const replacements: Record<string, string> = {
    // Affmine publisher macros — campaign = our offer
    '#cmpid#': tokenValue(campaignId),
    '#cmpname#': tokenValue(campaignName),
    '#payout#': tokenValue(payout),
    '#amount#': tokenValue(amount),
    '#price#': tokenValue(payout),
    '#datetime#': tokenValue(String(unix)),
    '#ip#': tokenValue(ip),
    '#country#': tokenValue(country),
    // Publisher tracking subs from our click/postback map (inbound s3/s4)
    '#s1#': tokenValue(sub1),
    '#s2#': tokenValue(sub2),
    '#s3#': tokenValue(sub3),
    '#s4#': tokenValue(sub4),
    '#status#': tokenValue(status),
  }

  let url = template
  for (const [token, value] of Object.entries(replacements)) {
    url = url.split(token).join(value)
  }
  return url
}

/**
 * Fire the publisher's Global S2S postback with real conversion lead data.
 */
export async function firePublisherGlobalPostback(
  userId: string,
  lead: PublisherPostbackLead,
): Promise<PublisherPostbackFireResult> {
  const publisherRows = await prisma.$queryRaw<Array<{
    globalPostbackUrl: string | null
    globalPostbackEnabled: boolean | null
  }>>`
    SELECT "globalPostbackUrl", "globalPostbackEnabled"
    FROM "users"
    WHERE "id" = ${userId}
    LIMIT 1
  `
  const publisher = publisherRows[0]
  if (!publisher) return { fired: false, skipped: 'publisher_not_found' }
  if (publisher.globalPostbackEnabled === false) return { fired: false, skipped: 'disabled' }

  const template = (publisher.globalPostbackUrl || '').trim()
  if (!template) return { fired: false, skipped: 'empty_url' }

  const resolved = buildPublisherPostbackUrl(template, lead)
  let target: URL
  try {
    target = new URL(resolved)
  } catch {
    return { fired: false, skipped: 'invalid_url', url: resolved }
  }
  if (!/^https?:$/i.test(target.protocol)) {
    return { fired: false, skipped: 'invalid_protocol', url: target.toString() }
  }

  try {
    const response = await fetch(target.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'user-agent': 'LeadsynerPostback/1.0',
        accept: '*/*',
      },
    })
    console.info('Publisher global postback fired', {
      userId,
      status: response.status,
      offerId: lead.offerId,
      payout: lead.payout,
      amount: lead.amount,
      sub1: lead.sub3,
      sub2: lead.sub4,
      url: target.toString(),
    })
    return { fired: true, status: response.status, url: target.toString() }
  } catch (error) {
    console.error('Publisher global postback failed:', error)
    return {
      fired: false,
      skipped: 'request_failed',
      url: target.toString(),
      error: error instanceof Error ? error.message : 'request_failed',
    }
  }
}
