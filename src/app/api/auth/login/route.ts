import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyCredentials, generateToken, JWT_EXPIRY } from '@/lib/auth'
import { getCorsHeaders } from '@/config/cors'
import { prisma } from '@/lib/db/prisma'
import { createUserSafe } from '@/lib/db/user'
import { MANAGER_USERNAME, MANAGER_PASSWORD } from '@/lib/constants'
import { checkRateLimit, getResetTime } from '@/lib/utils/rate-limiter'

const MANAGER_ENV_USERNAME = MANAGER_USERNAME?.trim() || ''
const MANAGER_ENV_PASSWORD = MANAGER_PASSWORD?.trim() || ''

/**
 * Get client IP from request headers
 */
const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin') || null
    const clientIp = getClientIp(request)

    // Rate limit: 5 attempts per 15 minutes per IP address
    if (!checkRateLimit(clientIp, 5, 15 * 60 * 1000)) {
      const resetTime = getResetTime(clientIp)
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retryAfterSeconds: Math.ceil(resetTime / 1000),
        },
        {
          status: 429,
          headers: {
            ...getCorsHeaders(origin),
            'Retry-After': Math.ceil(resetTime / 1000).toString(),
          },
        }
      )
    }

    let body: Record<string, unknown> = {}
    try {
      const rawBody = await request.text()
      if (rawBody) {
        body = JSON.parse(rawBody) as Record<string, unknown>
      }
    } catch {
      body = {}
    }

    // Normalize inputs to avoid whitespace/case issues
    const rawUsername = body?.username
    const rawPassword = body?.password
    const username = typeof rawUsername === 'string' ? rawUsername.trim() : ''
    const password = typeof rawPassword === 'string' ? rawPassword : ''

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username or email and password required' },
        { status: 400, headers: getCorsHeaders(origin) }
      )
    }

    // Env manager credentials always win (create/upgrade to MANAGER).
    // Otherwise a leftover PUBLISHER row with the same username would keep
    // logging you into the publisher dashboard on a fresh deploy.
    const isManagerEnvLogin = Boolean(
      MANAGER_ENV_USERNAME
      && MANAGER_ENV_PASSWORD
      && username === MANAGER_ENV_USERNAME
      && password === MANAGER_ENV_PASSWORD
    )

    let user = null
    let dbError = false

    if (isManagerEnvLogin) {
      try {
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { username: { equals: MANAGER_ENV_USERNAME, mode: 'insensitive' } },
              { email: { equals: MANAGER_ENV_USERNAME, mode: 'insensitive' } },
            ],
          },
        })

        const hashed = await bcrypt.hash(MANAGER_ENV_PASSWORD, 10)
        if (!existing) {
          user = await createUserSafe({
            username: MANAGER_ENV_USERNAME,
            email: `${MANAGER_ENV_USERNAME}@example.com`,
            password: hashed,
            role: 'MANAGER',
            status: 'ACTIVE',
          } as any)
        } else {
          user = await prisma.user.update({
            where: { id: existing.id },
            data: {
              password: hashed,
              role: 'MANAGER',
              status: 'ACTIVE',
              lastLogin: new Date(),
            },
            select: {
              id: true,
              username: true,
              role: true,
              status: true,
            },
          })
        }
      } catch (err) {
        console.error('Manager bootstrap/login failed for user=', username, err)
        dbError = true
        console.warn('DB unavailable; issuing in-memory token for', username)
        user = { id: `local-${MANAGER_ENV_USERNAME}`, username: MANAGER_ENV_USERNAME, role: 'MANAGER', status: 'ACTIVE' } as any
      }
    } else {
      // Normal publisher (or other) credential verification.
      try {
        user = await verifyCredentials(username, password)
      } catch (err) {
        console.error('verifyCredentials error for user=', username, err)
        dbError = true
      }
    }

    if (!user) {
      console.error('Invalid credentials attempt for user=', username, { dbError })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: getCorsHeaders(origin) }
      )
    }

    if (user.status !== 'ACTIVE') {
      const message = user.role === 'PUBLISHER'
        ? user.status === 'PENDING'
          ? 'Your publisher account is currently awaiting manager approval.'
          : user.status === 'REJECTED'
            ? 'Your publisher account was rejected by the manager.'
            : 'Your publisher account is disabled.'
        : 'Your account is disabled.'

      return NextResponse.json({ error: message }, { status: 403, headers: getCorsHeaders(origin) })
    }

    const token = generateToken(user.id)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    }, { headers: getCorsHeaders(origin) })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: JWT_EXPIRY,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
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