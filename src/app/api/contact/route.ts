import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkRateLimit, getResetTime } from '@/lib/utils/rate-limiter'

function getClientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  const rateLimitKey = `contact:${clientIp}`
  if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
    const retryAfter = Math.ceil(getResetTime(rateLimitKey) / 1000)
    return NextResponse.json(
      { error: 'Too many messages. Please try again later.' },
      { status: 429, headers: { 'Retry-After': retryAfter.toString() } },
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const values = payload as Record<string, unknown>
  const firstName = typeof values.firstName === 'string' ? values.firstName.trim() : ''
  const lastName = typeof values.lastName === 'string' ? values.lastName.trim() : ''
  const email = typeof values.email === 'string' ? values.email.trim().toLowerCase() : ''
  const message = typeof values.message === 'string' ? values.message.trim() : ''

  if (
    !firstName || firstName.length > 100
    || !lastName || lastName.length > 100
    || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254
    || !message || message.length > 5000
  ) {
    return NextResponse.json({ error: 'Please provide valid contact details and a message under 5000 characters.' }, { status: 400 })
  }

  const inquiry = await prisma.contactInquiry.create({
    data: { firstName, lastName, email, message },
    select: { id: true },
  })

  return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 })
}
