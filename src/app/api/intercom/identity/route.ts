import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken } from '@/lib/auth'
import { ensurePublisherNumber } from '@/lib/db/user'

export async function GET(request: Request) {
  const origin = request.headers.get('origin') || null
  const secret = (process.env.INTERCOM_IDENTITY_SECRET || '').trim()
  if (!secret) {
    return NextResponse.json({ userHash: null }, { headers: getCorsHeaders(origin) })
  }

  const token = getTokenFromCookie(request.headers.get('cookie') || '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) })
  }

  const user = await getUserFromToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) })
  }

  const publisherNumber = (user.role === 'PUBLISHER' || user.role === 'MANAGER')
    ? (user.publisherNumber ?? await ensurePublisherNumber(user.id))
    : user.publisherNumber
  const userId = String(publisherNumber ?? user.id)
  const userHash = createHmac('sha256', secret).update(userId).digest('hex')

  return NextResponse.json({ userId, userHash }, { headers: getCorsHeaders(origin) })
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) })
}
