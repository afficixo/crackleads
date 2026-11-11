import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

async function requireUser(request: Request) {
  const origin = request.headers.get('origin') || null
  const token = getTokenFromCookie(request.headers.get('cookie') || '')
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) }) }
  }
  const user = await getUserFromToken(token)
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) }) }
  }
  return { user, origin }
}

export async function GET(request: Request) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const { user, origin } = auth
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const statusFilter =
    status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED'
      ? status
      : undefined

  try {
    const applications = await prisma.offerApplication.findMany({
      where: user.role === 'MANAGER'
        ? statusFilter
          ? { status: statusFilter }
          : undefined
        : {
            publisherId: user.id,
            ...(statusFilter ? { status: statusFilter } : {}),
          },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    })

    return NextResponse.json({ applications }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('List offer applications failed:', error)
    return NextResponse.json(
      { error: 'Unable to load offer applications' },
      { status: 503, headers: getCorsHeaders(origin) }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const { user, origin } = auth
  if (user.role !== 'PUBLISHER') {
    return NextResponse.json(
      { error: 'Only publishers can apply for offers' },
      { status: 403, headers: getCorsHeaders(origin) }
    )
  }

  try {
    const body = await request.json()
    const campaignId = typeof body?.campaignId === 'string' ? body.campaignId.trim() : ''
    const campaignName = typeof body?.campaignName === 'string' ? body.campaignName.trim() : ''
    const campaignPayout = typeof body?.campaignPayout === 'number' ? body.campaignPayout : Number(body?.campaignPayout)
    const campaignCountry = typeof body?.campaignCountry === 'string' ? body.campaignCountry.trim().toUpperCase() : ''
    const campaignCategory = typeof body?.campaignCategory === 'string' ? body.campaignCategory.trim() : null
    const campaignImage = typeof body?.campaignImage === 'string' ? body.campaignImage.trim() : null

    if (!campaignId || !campaignName || !campaignCountry || !Number.isFinite(campaignPayout)) {
      return NextResponse.json(
        { error: 'Campaign details are required' },
        { status: 400, headers: getCorsHeaders(origin) }
      )
    }

    const existing = await prisma.offerApplication.findUnique({
      where: {
        publisherId_campaignId: {
          publisherId: user.id,
          campaignId,
        },
      },
    })

    if (existing) {
      if (existing.status === 'REJECTED') {
        const reopened = await prisma.offerApplication.update({
          where: { id: existing.id },
          data: {
            status: 'PENDING',
            campaignName,
            campaignPayout,
            campaignCountry,
            campaignCategory,
            campaignImage,
            reviewNote: null,
            reviewedAt: null,
            reviewedById: null,
            reviewedByUsername: null,
            noticeDismissed: true,
          },
        })
        return NextResponse.json({ application: reopened }, { headers: getCorsHeaders(origin) })
      }

      return NextResponse.json(
        { error: existing.status === 'APPROVED' ? 'Offer already approved' : 'Application already pending', application: existing },
        { status: 409, headers: getCorsHeaders(origin) }
      )
    }

    const application = await prisma.offerApplication.create({
      data: {
        campaignId,
        campaignName,
        campaignPayout,
        campaignCountry,
        campaignCategory,
        campaignImage,
        publisherId: user.id,
        publisherUsername: user.username,
        publisherEmail: user.email ?? null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ application }, { status: 201, headers: getCorsHeaders(origin) })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Application already exists for this offer' },
        { status: 409, headers: getCorsHeaders(origin) }
      )
    }
    console.error('Create offer application failed:', error)
    return NextResponse.json(
      { error: 'Unable to submit offer application' },
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
