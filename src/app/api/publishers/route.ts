import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { ensurePublisherNumber } from '@/lib/db/user'

const STATUSES = ['PENDING', 'ACTIVE', 'DISABLED', 'REJECTED'] as const
type PublisherStatus = (typeof STATUSES)[number]

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
  if (user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Only managers can manage publishers' }, { status: 403, headers: getCorsHeaders(origin) })
  }

  const url = new URL(request.url)
  const statusParam = url.searchParams.get('status')
  const statusFilter = STATUSES.includes(statusParam as PublisherStatus)
    ? (statusParam as PublisherStatus)
    : undefined
  const search = url.searchParams.get('q')?.trim() || ''

  try {
    const publishers = await prisma.user.findMany({
      where: {
        role: 'PUBLISHER',
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search
          ? {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
                { contractNumber: { contains: search, mode: 'insensitive' } },
                ...(Number.isFinite(Number(search.replace(/^#/, '')))
                  ? [{ publisherNumber: Number(search.replace(/^#/, '')) }]
                  : []),
              ],
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        address: true,
        contractNumber: true,
        telegramUsername: true,
        source: true,
        publisherNumber: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        referredBy: {
          select: { id: true, username: true },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    })

    const publishersWithIds = await Promise.all(
      publishers.map(async (publisher) => {
        if (publisher.publisherNumber != null) return publisher
        const publisherNumber = await ensurePublisherNumber(publisher.id)
        return { ...publisher, publisherNumber }
      })
    )

    return NextResponse.json({ publishers: publishersWithIds }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('List publishers failed:', error)
    return NextResponse.json(
      { error: 'Unable to load publishers' },
      { status: 503, headers: getCorsHeaders(origin) }
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
