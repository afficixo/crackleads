import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyCredentials, generateToken, JWT_EXPIRY } from '@/lib/auth'
import { getCorsHeaders } from '@/config/cors'
import { prisma } from '@/lib/db/prisma'
import { getManagerEnvCredentials, isManagerEnvLoginAttempt } from '@/lib/manager-auth'
import { checkRateLimit, getResetTime } from '@/lib/utils/rate-limiter'

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

    const { username: managerUsername, password: managerPassword } = getManagerEnvCredentials()
    const isManagerEnvLogin = isManagerEnvLoginAttempt(username, password)

    let user: {
      id: string
      username: string
      role: 'MANAGER' | 'PUBLISHER'
      status: string
    } | null = null
    let dbError = false

    if (isManagerEnvLogin && managerUsername && managerPassword) {
      try {
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { username: { equals: managerUsername, mode: 'insensitive' } },
              { email: { equals: managerUsername, mode: 'insensitive' } },
              { email: { equals: `${managerUsername}@example.com`, mode: 'insensitive' } },
              { username: { equals: username, mode: 'insensitive' } },
              { email: { equals: username, mode: 'insensitive' } },
            ],
          },
          select: { id: true, username: true, email: true },
        })

        const hashed = await bcrypt.hash(managerPassword, 10)

        // Use direct Prisma writes so createUserSafe cannot drop `role`.
        if (!existing) {
          user = await prisma.user.create({
            data: {
              username: managerUsername,
              email: `${managerUsername}@example.com`,
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
        } else {
          user = await prisma.user.update({
            where: { id: existing.id },
            data: {
              username: managerUsername,
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

        // Absolute guarantee for the session payload.
        user = { ...user, role: 'MANAGER', status: 'ACTIVE' }
      } catch (err) {
        console.error('Manager bootstrap/login failed for user=', username, err)
        dbError = true
        console.warn('DB unavailable; issuing in-memory token for', managerUsername)
        user = {
          id: `local-${managerUsername}`,
          username: managerUsername,
          role: 'MANAGER',
          status: 'ACTIVE',
        }
      }
    } else {
      try {
        user = await verifyCredentials(username, password)
      } catch (err) {
        console.error('verifyCredentials error for user=', username, err)
        dbError = true
      }
    }

    if (!user) {
      console.error('Invalid credentials attempt for user=', username, { dbError, isManagerEnvLogin })
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
    const role = isManagerEnvLogin ? 'MANAGER' : user.role

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role,
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
