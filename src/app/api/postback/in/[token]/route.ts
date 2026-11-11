import { NextResponse } from 'next/server'
import { ingestMarketplacePostback } from '@/lib/marketplace-postback'

type RouteContext = {
  params: Promise<{ token: string }>
}

function collectParams(request: Request): URLSearchParams {
  const url = new URL(request.url)
  return url.searchParams
}

async function handle(request: Request, context: RouteContext) {
  const { token: rawToken } = await context.params
  const token = decodeURIComponent(rawToken || '').trim()
  if (!token) {
    return new NextResponse('missing token', { status: 400 })
  }

  let params = collectParams(request)
  if (request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const body = await request.text()
        const bodyParams = new URLSearchParams(body)
        bodyParams.forEach((value, key) => {
          if (!params.has(key)) params.set(key, value)
        })
      } else if (contentType.includes('application/json')) {
        const json = await request.json() as Record<string, unknown>
        Object.entries(json).forEach(([key, value]) => {
          if (value == null || params.has(key)) return
          params.set(key, String(value))
        })
      }
    } catch {
      // Ignore body parse errors; query string may still be enough.
    }
  }

  try {
    const result = await ingestMarketplacePostback(token, params)
    if (!result.ok) {
      return new NextResponse(result.error, { status: result.status })
    }

    // Networks often expect plain "OK" / 1 on success.
    const headers: Record<string, string> = {
      'content-type': 'text/plain; charset=utf-8',
      'x-conversion-id': result.leadId,
      'x-publisher-id': String(result.publisherNumber),
      'x-offer-id': result.offerId,
      'x-payout': String(result.payout),
    }
    if (result.publisherPostback) {
      headers['x-publisher-postback'] = result.publisherPostback.fired ? 'fired' : 'skipped'
      if (result.publisherPostback.status != null) {
        headers['x-publisher-postback-status'] = String(result.publisherPostback.status)
      }
      if (result.publisherPostback.skipped) {
        headers['x-publisher-postback-skipped'] = result.publisherPostback.skipped
      }
    }
    return new NextResponse(result.duplicate ? 'OK duplicate' : 'OK', {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Marketplace postback ingest failed:', error)
    return new NextResponse('postback processing failed', { status: 500 })
  }
}

export async function GET(request: Request, context: RouteContext) {
  return handle(request, context)
}

export async function POST(request: Request, context: RouteContext) {
  return handle(request, context)
}
