import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

const STATUSES = ['PENDING', 'ACTIVE', 'DISABLED', 'REJECTED'] as const
type PublisherStatus = (typeof STATUSES)[number]

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Publisher id required' }, { status: 400, headers: getCorsHeaders(origin) })
  }

  try {
    const body = await request.json()
    const status = STATUSES.includes(body?.status as PublisherStatus)
      ? (body.status as PublisherStatus)
      : null

    if (!status) {
      return NextResponse.json(
        { error: 'status must be PENDING, ACTIVE, DISABLED, or REJECTED' },
        { status: 400, headers: getCorsHeaders(origin) }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, username: true, status: true },
    })

    if (!existing || existing.role !== 'PUBLISHER') {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404, headers: getCorsHeaders(origin) })
    }

    if (existing.id === user.id) {
      return NextResponse.json({ error: 'Cannot change your own account status' }, { status: 400, headers: getCorsHeaders(origin) })
    }

    const publisher = await prisma.user.update({
      where: { id },
      data: { status },
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
    })

    return NextResponse.json({ publisher }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Update publisher failed:', error)
    return NextResponse.json(
      { error: 'Unable to update publisher' },
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
