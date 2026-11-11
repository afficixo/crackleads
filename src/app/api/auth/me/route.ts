import { NextResponse } from 'next/server'
import { getUserFromToken, getTokenFromCookie, normalizeEffectiveUserRole } from '@/lib/auth'
import { getCorsHeaders } from '@/config/cors'
import { ensurePublisherNumber } from '@/lib/db/user'

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin') || null
    const cookieHeader = request.headers.get('cookie') || ''
    const token = getTokenFromCookie(cookieHeader)

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders(origin) }
      )
    }

    const user = await getUserFromToken(token)

    if (!user) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders(origin) }
      )
      response.cookies.delete('auth-token')
      return response
    }

    if (user.role === 'PUBLISHER' && user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account pending approval' },
        { status: 403, headers: getCorsHeaders(origin) }
      )
    }

    const effectiveRole = normalizeEffectiveUserRole(user)
    const publisherNumber = user.role === 'PUBLISHER'
      ? (user.publisherNumber ?? await ensurePublisherNumber(user.id))
      : user.publisherNumber ?? null

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: effectiveRole,
      email: user.email,
      fullName: user.fullName,
      publisherNumber,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      status: user.status,
    }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503, headers: getCorsHeaders(request.headers.get('origin')) }
    )
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  })
}