import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken, normalizeEffectiveUserRole } from '@/lib/auth'
import { getOverviewStats } from '@/lib/analytics'

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

  const role = normalizeEffectiveUserRole(user)
  const stats = await getOverviewStats({
    role: role === 'MANAGER' ? 'MANAGER' : 'PUBLISHER',
    userId: user.id,
    publisherNumber: user.publisherNumber,
  })

  return NextResponse.json(stats, { headers: getCorsHeaders(origin) })
}
