import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getCorsHeaders } from '@/config/cors'
import { getTokenFromCookie, getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || null
  const token = getTokenFromCookie(request.headers.get('cookie') || '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) })
  }

  const authUser = await getUserFromToken(token)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(origin) })
  }

  if (authUser.id.startsWith('local-')) {
    return NextResponse.json(
      { error: 'Password changes require a saved account. Sign in with a database manager account.' },
      { status: 400, headers: getCorsHeaders(origin) }
    )
  }

  try {
    const body = await request.json()
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''
    const repeatPassword = typeof body?.repeatPassword === 'string' ? body.repeatPassword : ''

    if (!currentPassword || !newPassword || !repeatPassword) {
      return NextResponse.json({ error: 'All password fields are required' }, { status: 400, headers: getCorsHeaders(origin) })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400, headers: getCorsHeaders(origin) })
    }
    if (newPassword !== repeatPassword) {
      return NextResponse.json({ error: 'New password and repeat password do not match' }, { status: 400, headers: getCorsHeaders(origin) })
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from the current password' }, { status: 400, headers: getCorsHeaders(origin) })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, password: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404, headers: getCorsHeaders(origin) })
    }

    const matches = await bcrypt.compare(currentPassword, user.password)
    if (!matches) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400, headers: getCorsHeaders(origin) })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    return NextResponse.json({ success: true }, { headers: getCorsHeaders(origin) })
  } catch (error) {
    console.error('Change password failed:', error)
    return NextResponse.json({ error: 'Unable to change password' }, { status: 503, headers: getCorsHeaders(origin) })
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) })
}
