import { NextResponse, NextRequest } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || null
  const cookieHeader = request.headers.get('cookie') || ''

  // Verify user has a valid token before logging out
  const token = getTokenFromCookie(cookieHeader)
  if (!token) {
    return NextResponse.json(
      { error: 'Not logged in' },
      { status: 400, headers: getCorsHeaders(origin) }
    )
  }

  const response = NextResponse.json(
    { success: true },
    { headers: getCorsHeaders(origin) }
  )
  response.cookies.delete('auth-token')
  return response
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  })
}