import { NextResponse } from 'next/server'
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

async function assignManagerId() {
  const manager = await prisma.user.findFirst({
    where: { role: 'MANAGER', status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  return manager?.id ?? null
}

function serializeConversation(conversation: {
  id: string
  status: string
  createdAt: Date
  updatedAt: Date
  publisherId: string
  managerId: string | null
  publisher?: { id: string; username: string; fullName: string | null; email: string } | null
  manager?: { id: string; username: string; fullName: string | null } | null
  messages: Array<{
    id: string
    body: string
    createdAt: Date
    senderId: string
    sender: { id: string; username: string; role: string; fullName: string | null }
  }>
}) {
  return {
    id: conversation.id,
    status: conversation.status,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    publisherId: conversation.publisherId,
    managerId: conversation.managerId,
    publisher: conversation.publisher
      ? {
          id: conversation.publisher.id,
          username: conversation.publisher.username,
          fullName: conversation.publisher.fullName,
          email: conversation.publisher.email,
        }
      : null,
    manager: conversation.manager
      ? {
          id: conversation.manager.id,
          username: conversation.manager.username,
          fullName: conversation.manager.fullName,
        }
      : null,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        role: message.sender.role,
        fullName: message.sender.fullName,
      },
    })),
  }
}

const messageInclude = {
  sender: {
    select: { id: true, username: true, role: true, fullName: true },
  },
} as const

export async function GET(request: Request) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error
  const { user, origin } = auth

  try {
    if (user.role === 'MANAGER') {
      const url = new URL(request.url)
      const conversationId = url.searchParams.get('conversationId')

      if (conversationId) {
        const conversation = await prisma.supportConversation.findUnique({
          where: { id: conversationId },
          include: {
            publisher: { select: { id: true, username: true, fullName: true, email: true } },
            manager: { select: { id: true, username: true, fullName: true } },
            messages: {
              orderBy: { createdAt: 'asc' },
              include: messageInclude,
            },
          },
        })
        if (!conversation) {
          return NextResponse.json({ error: 'Conversation not found' }, { status: 404, headers: getCorsHeaders(origin) })
        }
        return NextResponse.json({ conversation: serializeConversation(conversation) }, { headers: getCorsHeaders(origin) })
      }

      const conversations = await prisma.supportConversation.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: {
          publisher: { select: { id: true, username: true, fullName: true, email: true } },
          manager: { select: { id: true, username: true, fullName: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: messageInclude,
          },
        },
      })

      return NextResponse.json({
        conversations: conversations.map((item) => serializeConversation({
          ...item,
          messages: [...item.messages].reverse(),
        })),
      }, { headers: getCorsHeaders(origin) })
    }

    const conversation = await prisma.supportConversation.findUnique({
      where: { publisherId: user.id },
      include: {
        publisher: { select: { id: true, username: true, fullName: true, email: true } },
        manager: { select: { id: true, username: true, fullName: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: messageInclude,
        },
      },
    })

    return NextResponse.json({
      conversation: conversation ? serializeConversation(conversation) : null,
    }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Load support failed:', error)
    return NextResponse.json({ error: 'Unable to load support' }, { status: 503, headers: getCorsHeaders(origin) })
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error
  const { user, origin } = auth

  try {
    const body = await request.json()
    const messageBody = typeof body?.body === 'string' ? body.body.trim().slice(0, 4000) : ''
    const conversationId = typeof body?.conversationId === 'string' ? body.conversationId.trim() : ''

    if (!messageBody) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400, headers: getCorsHeaders(origin) })
    }

    if (user.role === 'MANAGER') {
      if (!conversationId) {
        return NextResponse.json({ error: 'conversationId is required' }, { status: 400, headers: getCorsHeaders(origin) })
      }

      const existing = await prisma.supportConversation.findUnique({ where: { id: conversationId } })
      if (!existing) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404, headers: getCorsHeaders(origin) })
      }

      const conversation = await prisma.supportConversation.update({
        where: { id: conversationId },
        data: {
          status: 'OPEN',
          managerId: existing.managerId || user.id,
          updatedAt: new Date(),
          messages: {
            create: {
              senderId: user.id,
              body: messageBody,
            },
          },
        },
        include: {
          publisher: { select: { id: true, username: true, fullName: true, email: true } },
          manager: { select: { id: true, username: true, fullName: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: messageInclude,
          },
        },
      })

      return NextResponse.json({ conversation: serializeConversation(conversation) }, { headers: getCorsHeaders(origin) })
    }

    if (user.role !== 'PUBLISHER') {
      return NextResponse.json({ error: 'Unsupported role' }, { status: 403, headers: getCorsHeaders(origin) })
    }

    const managerId = await assignManagerId()
    const existing = await prisma.supportConversation.findUnique({ where: { publisherId: user.id } })

    const conversation = existing
      ? await prisma.supportConversation.update({
          where: { id: existing.id },
          data: {
            status: 'OPEN',
            managerId: existing.managerId || managerId,
            updatedAt: new Date(),
            messages: {
              create: {
                senderId: user.id,
                body: messageBody,
              },
            },
          },
          include: {
            publisher: { select: { id: true, username: true, fullName: true, email: true } },
            manager: { select: { id: true, username: true, fullName: true } },
            messages: {
              orderBy: { createdAt: 'asc' },
              include: messageInclude,
            },
          },
        })
      : await prisma.supportConversation.create({
          data: {
            publisherId: user.id,
            managerId,
            status: 'OPEN',
            messages: {
              create: {
                senderId: user.id,
                body: messageBody,
              },
            },
          },
          include: {
            publisher: { select: { id: true, username: true, fullName: true, email: true } },
            manager: { select: { id: true, username: true, fullName: true } },
            messages: {
              orderBy: { createdAt: 'asc' },
              include: messageInclude,
            },
          },
        })

    return NextResponse.json({ conversation: serializeConversation(conversation) }, { status: 201, headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Send support message failed:', error)
    return NextResponse.json({ error: 'Unable to send message' }, { status: 503, headers: getCorsHeaders(origin) })
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) })
}
