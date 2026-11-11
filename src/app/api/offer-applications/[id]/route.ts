import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

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

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Application id required' }, { status: 400, headers: getCorsHeaders(origin) })
  }

  try {
    const body = await request.json()
    const dismissNotice = body?.dismissNotice === true
    const status = body?.status === 'APPROVED' || body?.status === 'REJECTED' ? body.status : null
    const reviewNote = typeof body?.reviewNote === 'string' ? body.reviewNote.trim().slice(0, 500) : null

    const existing = await prisma.offerApplication.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404, headers: getCorsHeaders(origin) })
    }

    if (dismissNotice) {
      if (user.role !== 'PUBLISHER' || existing.publisherId !== user.id) {
        return NextResponse.json(
          { error: 'Only the publisher can dismiss this notice' },
          { status: 403, headers: getCorsHeaders(origin) }
        )
      }
      if (existing.status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'Only approved offer notices can be dismissed' },
          { status: 400, headers: getCorsHeaders(origin) }
        )
      }

      const application = await prisma.offerApplication.update({
        where: { id },
        data: { noticeDismissed: true },
      })
      return NextResponse.json({ application }, { headers: getCorsHeaders(origin) })
    }

    if (user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Only managers can review applications' }, { status: 403, headers: getCorsHeaders(origin) })
    }

    if (!status) {
      return NextResponse.json(
        { error: 'status must be APPROVED or REJECTED' },
        { status: 400, headers: getCorsHeaders(origin) }
      )
    }

    const application = await prisma.offerApplication.update({
      where: { id },
      data: {
        status,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
        reviewedById: user.id,
        reviewedByUsername: user.username,
        noticeDismissed: status === 'APPROVED' ? false : true,
      },
    })

    return NextResponse.json({ application }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Review offer application failed:', error)
    return NextResponse.json(
      { error: 'Unable to update offer application' },
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
