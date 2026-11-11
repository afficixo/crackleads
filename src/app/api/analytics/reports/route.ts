import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken, normalizeEffectiveUserRole } from '@/lib/auth'
import { getReportData } from '@/lib/analytics'

const REPORT_TYPES = new Set(['daily', 'campaign', 'geo', 'subid', 'conversions', 'tool'])

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

  const url = new URL(request.url)
  const type = (url.searchParams.get('type') || 'daily').toLowerCase()
  if (!REPORT_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400, headers: getCorsHeaders(origin) })
  }
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const role = normalizeEffectiveUserRole(user)
  const report = await getReportData(
    {
      role: role === 'MANAGER' ? 'MANAGER' : 'PUBLISHER',
      userId: user.id,
      publisherNumber: user.publisherNumber,
    },
    type as 'daily' | 'campaign' | 'geo' | 'subid' | 'conversions' | 'tool',
    { from, to },
  )

  return NextResponse.json(report, { headers: getCorsHeaders(origin) })
}
